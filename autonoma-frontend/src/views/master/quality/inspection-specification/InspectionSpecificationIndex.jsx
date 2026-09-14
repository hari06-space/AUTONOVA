import React, { useState } from 'react';
import InspectionSpecificationList from './InspectionSpecificationList';
import InspectionSpecificationForm from './InspectionSpecificationForm';

const InspectionSpecificationIndex = () => {
    const [view, setView] = useState('list');
    const [editId, setEditId] = useState(null);

    const handleAdd = () => { setEditId(null); setView('form'); };
    const handleEdit = (id) => { setEditId(id); setView('form'); };
    const handleBack = () => { setView('list'); setEditId(null); };

    return (
        <>
            {view === 'list' && <InspectionSpecificationList onAdd={handleAdd} onEdit={handleEdit} />}
            {view === 'form' && <InspectionSpecificationForm id={editId} onCancel={handleBack} onSaved={handleBack} />}
        </>
    );
};

export default InspectionSpecificationIndex;
