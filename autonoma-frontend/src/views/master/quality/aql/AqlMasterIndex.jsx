import React, { useState } from 'react';
import AqlMasterList from './AqlMasterList';
import AqlMasterForm from './AqlMasterForm';

const AqlMasterIndex = () => {
    const [view, setView] = useState('list');
    const [editId, setEditId] = useState(null);

    const handleAdd = () => {
        setEditId(null);
        setView('form');
    };

    const handleEdit = (id) => {
        setEditId(id);
        setView('form');
    };

    const handleCancel = () => {
        setView('list');
        setEditId(null);
    };

    return (
        <>
            {view === 'list' && (
                <AqlMasterList 
                    onAdd={handleAdd} 
                    onEdit={handleEdit} 
                />
            )}
            
            {view === 'form' && (
                <AqlMasterForm 
                    id={editId} 
                    onCancel={handleCancel} 
                />
            )}
        </>
    );
};

export default AqlMasterIndex;
