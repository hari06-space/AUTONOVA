package com.autonoma.erp.modules.finance.service;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.finance.dto.FinancePostingDTO;
import com.autonoma.erp.modules.finance.dto.OutstandingBalanceDTO;
import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import com.autonoma.erp.modules.finance.entity.FinanceTransaction;
import com.autonoma.erp.modules.finance.repository.FinanceOutstandingRepository;
import com.autonoma.erp.modules.finance.repository.FinanceTransactionRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinancePostingServiceImpl implements FinancePostingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FinancePostingServiceImpl.class);

    private final FinanceTransactionRepository transactionRepository;
    private final FinanceOutstandingRepository outstandingRepository;
    private final AccountLedgerRepository accountLedgerRepository;
    private final StatusMasterRepository statusMasterRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void postInvoice(FinancePostingDTO dto) {
        // 1. Idempotency Check
        if (dto.getRefId() != null && transactionRepository.existsByRefIdAndTransType(dto.getRefId(), dto.getTransType())) {
            log.info("Transaction with refId {} and type {} already posted.", dto.getRefId(), dto.getTransType());
            return;
        }

        // 2. Validate Party & Head
        AccountLedger party = accountLedgerRepository.findById(dto.getPartyId())
                .orElseThrow(() -> new IllegalArgumentException("Party Ledger not found"));
        AccountLedger head = accountLedgerRepository.findById(dto.getHeadId())
                .orElseThrow(() -> new IllegalArgumentException("Head Ledger not found"));

        // 3. Create Outstanding Record
        FinanceOutstanding outstanding = new FinanceOutstanding();
        outstanding.setTransDate(dto.getTransDate() != null ? dto.getTransDate() : new Date());
        outstanding.setTransType(dto.getTransType());
        outstanding.setParty(party);
        outstanding.setVrNo(dto.getVrNo());
        outstanding.setPartyBillNo(dto.getPartyBillNo());
        outstanding.setPartyBillDate(dto.getPartyBillDate());
        
        // Initial amounts
        outstanding.setDrAmt(dto.getDrAmt() != null ? dto.getDrAmt() : BigDecimal.ZERO);
        outstanding.setCrAmt(dto.getCrAmt() != null ? dto.getCrAmt() : BigDecimal.ZERO);
        
        outstanding.setChequeNo(dto.getChequeNo());
        outstanding.setChequeDate(dto.getChequeDate());
        outstanding.setOnAccount(false);

        if (dto.getDivisionId() != null) {
            outstanding.setDivision(entityManager.getReference(Division.class, dto.getDivisionId()));
        }
        
        outstanding.setCreatedBy(dto.getUserId());
        outstanding.setCreatedDate(new Date());

        // Status is always active/open initially
        StatusMaster status = statusMasterRepository.findByNameIgnoreCase("OUTSTANDING")
                .orElseGet(() -> statusMasterRepository.findById(1L).orElse(null)); // Fallback
        outstanding.setStatus(status);

        FinanceOutstanding savedOutstanding = outstandingRepository.save(outstanding);

        // 4. Create Finance Transaction
        FinanceTransaction transaction = buildTransactionFromDto(dto, party, head);
        transaction.setBillOutstanding(savedOutstanding);
        
        transactionRepository.save(transaction);
        log.info("Successfully posted Invoice for Bill {} - Outstanding ID: {}", dto.getPartyBillNo(), savedOutstanding.getId());
    }

    @Override
    @Transactional
    public void postPayment(FinancePostingDTO dto, Long billOutstandingId) {
        // 1. Validate Outstanding
        FinanceOutstanding outstanding = outstandingRepository.findById(billOutstandingId)
                .orElseThrow(() -> new IllegalArgumentException("Outstanding Bill not found: " + billOutstandingId));

        if (!outstanding.getParty().getId().equals(dto.getPartyId())) {
            throw new IllegalArgumentException("Payment Party does not match Bill Party");
        }
        
        if (dto.getDivisionId() != null && outstanding.getDivision() != null &&
            !outstanding.getDivision().getId().equals(dto.getDivisionId())) {
            throw new IllegalArgumentException("Payment Division does not match Bill Division");
        }

        // 2. Validate Overpayment
        OutstandingBalanceDTO balance = calculateOutstanding(billOutstandingId);
        
        BigDecimal paymentAmt = dto.getDrAmt() != null && dto.getDrAmt().compareTo(BigDecimal.ZERO) > 0 
                                ? dto.getDrAmt() : dto.getCrAmt();
                                
        if (paymentAmt == null) paymentAmt = BigDecimal.ZERO;

        if (paymentAmt.compareTo(balance.getBalanceAmount()) > 0) {
            // Depending on strict business rules, reject or divert to On-Account. 
            // The prompt states: "Either reject OR classify excess as advance/on-account. Do not invent a new accounting behavior."
            // We will throw an exception to prevent accidental over-settlement. 
            throw new IllegalArgumentException("Payment amount (" + paymentAmt + ") exceeds outstanding balance (" + balance.getBalanceAmount() + "). Please post excess as On-Account payment.");
        }

        // 3. Create Transaction
        AccountLedger party = accountLedgerRepository.findById(dto.getPartyId())
                .orElseThrow(() -> new IllegalArgumentException("Party Ledger not found"));
        AccountLedger head = accountLedgerRepository.findById(dto.getHeadId())
                .orElseThrow(() -> new IllegalArgumentException("Head Ledger not found"));

        FinanceTransaction transaction = buildTransactionFromDto(dto, party, head);
        transaction.setBillOutstanding(outstanding);
        
        transactionRepository.save(transaction);
        log.info("Successfully posted Payment for Outstanding ID: {}", outstanding.getId());
    }

    @Override
    @Transactional
    public void postOnAccountPayment(FinancePostingDTO dto) {
        AccountLedger party = accountLedgerRepository.findById(dto.getPartyId())
                .orElseThrow(() -> new IllegalArgumentException("Party Ledger not found"));
        AccountLedger head = accountLedgerRepository.findById(dto.getHeadId())
                .orElseThrow(() -> new IllegalArgumentException("Head Ledger not found"));

        // Create Outstanding Record (On Account)
        FinanceOutstanding outstanding = new FinanceOutstanding();
        outstanding.setTransDate(dto.getTransDate() != null ? dto.getTransDate() : new Date());
        outstanding.setTransType(dto.getTransType());
        outstanding.setParty(party);
        outstanding.setVrNo(dto.getVrNo());
        
        outstanding.setDrAmt(dto.getDrAmt() != null ? dto.getDrAmt() : BigDecimal.ZERO);
        outstanding.setCrAmt(dto.getCrAmt() != null ? dto.getCrAmt() : BigDecimal.ZERO);
        
        outstanding.setOnAccount(true);

        if (dto.getDivisionId() != null) {
            outstanding.setDivision(entityManager.getReference(Division.class, dto.getDivisionId()));
        }
        
        outstanding.setCreatedBy(dto.getUserId());
        outstanding.setCreatedDate(new Date());

        FinanceOutstanding savedOutstanding = outstandingRepository.save(outstanding);

        // Create Transaction
        FinanceTransaction transaction = buildTransactionFromDto(dto, party, head);
        transaction.setBillOutstanding(savedOutstanding);
        
        transactionRepository.save(transaction);
        log.info("Successfully posted On-Account Payment - Outstanding ID: {}", savedOutstanding.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public OutstandingBalanceDTO calculateOutstanding(Long billOutstandingId) {
        FinanceOutstanding outstanding = outstandingRepository.findById(billOutstandingId)
                .orElseThrow(() -> new IllegalArgumentException("Outstanding Bill not found: " + billOutstandingId));

        List<FinanceTransaction> transactions = transactionRepository.findByBillOutstandingId(billOutstandingId);

        BigDecimal totalDr = BigDecimal.ZERO;
        BigDecimal totalCr = BigDecimal.ZERO;

        for (FinanceTransaction tx : transactions) {
            if (tx.getDrAmt() != null) totalDr = totalDr.add(tx.getDrAmt());
            if (tx.getCrAmt() != null) totalCr = totalCr.add(tx.getCrAmt());
        }

        // Determine balance based on whether the original bill was a Debit (e.g. Sales Invoice) or Credit (e.g. Purchase Invoice)
        // A supplier invoice usually credits the supplier. So original is CR.
        // A customer invoice usually debits the customer. So original is DR.
        
        BigDecimal originalAmount = outstanding.getDrAmt().add(outstanding.getCrAmt()); // One is usually 0
        BigDecimal settledAmount;
        BigDecimal balanceAmount;
        
        if (outstanding.getCrAmt().compareTo(BigDecimal.ZERO) > 0) {
            // It's a payable (CR)
            settledAmount = totalDr; 
            balanceAmount = totalCr.subtract(totalDr);
        } else {
            // It's a receivable (DR)
            settledAmount = totalCr;
            balanceAmount = totalDr.subtract(totalCr);
        }
        
        if (balanceAmount.compareTo(BigDecimal.ZERO) < 0) {
            balanceAmount = BigDecimal.ZERO; // Overpayment shouldn't happen due to our strict rules, but just in case
        }

        String derivedStatus;
        if (balanceAmount.compareTo(BigDecimal.ZERO) == 0) {
            derivedStatus = "PAID";
        } else if (balanceAmount.compareTo(originalAmount) < 0) {
            derivedStatus = "PARTIALLY_PAID";
        } else {
            derivedStatus = "OUTSTANDING";
        }
        
        long daysOutstanding = 0;
        if (outstanding.getTransDate() != null) {
            long diffInMillis = Math.abs(new Date().getTime() - outstanding.getTransDate().getTime());
            daysOutstanding = diffInMillis / (24 * 60 * 60 * 1000);
        }

        return OutstandingBalanceDTO.builder()
                .outstandingId(outstanding.getId())
                .partyId(outstanding.getParty().getId())
                .partyName(outstanding.getParty().getLedgerName())
                .partyBillNo(outstanding.getPartyBillNo())
                .partyBillDate(outstanding.getPartyBillDate())
                .dueDate(outstanding.getTransDate()) // Simplified
                .originalAmount(originalAmount)
                .settledAmount(settledAmount)
                .balanceAmount(balanceAmount)
                .status(derivedStatus)
                .daysOutstanding(daysOutstanding)
                .build();
    }

    private FinanceTransaction buildTransactionFromDto(FinancePostingDTO dto, AccountLedger party, AccountLedger head) {
        FinanceTransaction tx = new FinanceTransaction();
        tx.setTransDate(dto.getTransDate() != null ? dto.getTransDate() : new Date());
        tx.setTransType(dto.getTransType());
        tx.setRefId(dto.getRefId());
        tx.setVrName(dto.getVrName());
        tx.setVrNo(dto.getVrNo());
        
        tx.setHead(head);
        tx.setHeadName(head.getLedgerName());
        tx.setParty(party);
        
        tx.setDrAmt(dto.getDrAmt() != null ? dto.getDrAmt() : BigDecimal.ZERO);
        tx.setCrAmt(dto.getCrAmt() != null ? dto.getCrAmt() : BigDecimal.ZERO);
        tx.setTaxableAmt(dto.getTaxableAmt() != null ? dto.getTaxableAmt() : BigDecimal.ZERO);
        tx.setBillAmt(dto.getBillAmt() != null ? dto.getBillAmt() : BigDecimal.ZERO);
        
        tx.setNarration(dto.getNarration());
        tx.setPartyBillNo(dto.getPartyBillNo());
        tx.setPartyBillDate(dto.getPartyBillDate());
        tx.setTransMode(dto.getTransMode());
        tx.setChequeNo(dto.getChequeNo());
        tx.setChequeDate(dto.getChequeDate());
        tx.setDueDate(dto.getDueDate());
        
        tx.setRecoDone(false);

        if (dto.getDivisionId() != null) {
            tx.setDivision(entityManager.getReference(Division.class, dto.getDivisionId()));
        }
        
        tx.setCreatedBy(dto.getUserId());
        tx.setCreatedDate(new Date());

        return tx;
    }
}
