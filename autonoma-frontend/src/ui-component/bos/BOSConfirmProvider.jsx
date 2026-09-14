import React, { useState, useCallback } from 'react';
import { BOSConfirmDialog, BOSAlertDialog, _registerBOSConfirm, _registerBOSAlert } from 'ui-component/bos/BOSConfirmDialog';

/**
 * Mount ONCE in App.jsx - wires up both bosConfirm() and bosAlert() globally.
 */
const BOSConfirmProvider = () => {
    const [confirm, setConfirm] = useState(null);
    const [alert,   setAlert]   = useState(null);

    _registerBOSConfirm(useCallback((opts) => setConfirm(opts), []));
    _registerBOSAlert  (useCallback((opts) => setAlert(opts),   []));

    const handleConfirm = () => { confirm?.resolve(true);  setConfirm(null); };
    const handleCancel  = () => { confirm?.resolve(false); setConfirm(null); };
    const handleAlertClose = () => { alert?.resolve?.(); setAlert(null); };

    return (
        <>
            {confirm && (
                <BOSConfirmDialog
                    open={!!confirm}
                    {...confirm}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
            {alert && (
                <BOSAlertDialog
                    open={!!alert}
                    {...alert}
                    onClose={handleAlertClose}
                />
            )}
        </>
    );
};

export default BOSConfirmProvider;
