package com.autonoma.erp.modules.platform.identity.dto;

import java.util.List;

public class ClientDashboardDTO {

    private long totalClients;
    private long activeClients;
    private long inactiveClients;
    private long suspendedClients;
    private long expiredClients;
    private long trialClients;
    private long paidClients;
    private long licenseRenewalAlerts;
    private long totalUsers;
    private long totalBranches;
    private long totalStorageMb;
    private List<ClientMasterDTO> upcomingExpiries;

    // Getters and Setters
    public long getTotalClients() { return totalClients; }
    public void setTotalClients(long totalClients) { this.totalClients = totalClients; }

    public long getActiveClients() { return activeClients; }
    public void setActiveClients(long activeClients) { this.activeClients = activeClients; }

    public long getInactiveClients() { return inactiveClients; }
    public void setInactiveClients(long inactiveClients) { this.inactiveClients = inactiveClients; }

    public long getSuspendedClients() { return suspendedClients; }
    public void setSuspendedClients(long suspendedClients) { this.suspendedClients = suspendedClients; }

    public long getExpiredClients() { return expiredClients; }
    public void setExpiredClients(long expiredClients) { this.expiredClients = expiredClients; }

    public long getTrialClients() { return trialClients; }
    public void setTrialClients(long trialClients) { this.trialClients = trialClients; }

    public long getPaidClients() { return paidClients; }
    public void setPaidClients(long paidClients) { this.paidClients = paidClients; }

    public long getLicenseRenewalAlerts() { return licenseRenewalAlerts; }
    public void setLicenseRenewalAlerts(long licenseRenewalAlerts) { this.licenseRenewalAlerts = licenseRenewalAlerts; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalBranches() { return totalBranches; }
    public void setTotalBranches(long totalBranches) { this.totalBranches = totalBranches; }

    public long getTotalStorageMb() { return totalStorageMb; }
    public void setTotalStorageMb(long totalStorageMb) { this.totalStorageMb = totalStorageMb; }

    public List<ClientMasterDTO> getUpcomingExpiries() { return upcomingExpiries; }
    public void setUpcomingExpiries(List<ClientMasterDTO> upcomingExpiries) { this.upcomingExpiries = upcomingExpiries; }
}
