import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function FormBuilder({ formFields, setFormFields, locked }) {
    const [newFieldType, setNewFieldType] = useState("text");

    const addField = () => {
        if (locked) return;
        setFormFields([...formFields, {
            id: uuidv4(), type: newFieldType, label: "New Field", required: false,
            options: newFieldType === 'dropdown' ? ["Option 1", "Option 2"] : []
        }]);
    };

    const removeField = (id) => { if (locked) return; setFormFields(formFields.filter(f => f.id !== id)); };
    const updateField = (id, key, value) => { if (locked) return; setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f)); };

    const updateOption = (id, index, value) => {
        if (locked) return;
        const field = formFields.find(f => f.id === id);
        const newOptions = [...field.options];
        newOptions[index] = value;
        updateField(id, 'options', newOptions);
    };

    const addOption = (id) => {
        if (locked) return;
        const field = formFields.find(f => f.id === id);
        updateField(id, 'options', [...field.options, `Option ${field.options.length + 1}`]);
    };

    return (
        <div className="card mb-lg">
            <h4 style={{ marginBottom: 12 }}>📝 Custom Registration Form</h4>
            {locked && <p className="error-text">⚠️ Form is locked because registrations have already started.</p>}

            {formFields.map((field) => (
                <div key={field.id} className="card" style={{ background: "var(--gray-50)", marginBottom: 10 }}>
                    <div className="flex justify-between items-center mb-sm">
                        <label>Field Type: <strong>{field.type}</strong></label>
                        {!locked && <button onClick={() => removeField(field.id)} className="btn-danger btn-sm">Remove</button>}
                    </div>
                    <div className="form-group">
                        <input type="text" value={field.label} onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            placeholder="Field Label (e.g. T-Shirt Size)" disabled={locked} />
                    </div>
                    <label style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                            disabled={locked} style={{ marginRight: 6 }} /> Required
                    </label>

                    {field.type === 'dropdown' && (
                        <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: "2px solid var(--border)" }}>
                            <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.85rem" }}>Options:</p>
                            {field.options.map((opt, i) => (
                                <div key={i} className="form-group" style={{ marginBottom: 6 }}>
                                    <input value={opt} onChange={(e) => updateOption(field.id, i, e.target.value)} disabled={locked} style={{ width: "60%" }} />
                                </div>
                            ))}
                            {!locked && <button onClick={() => addOption(field.id)} className="btn-primary btn-sm">+ Add Option</button>}
                        </div>
                    )}
                </div>
            ))}

            {!locked && (
                <div className="flex gap-sm items-center mt">
                    <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} style={{ width: "auto" }}>
                        <option value="text">Text Input</option>
                        <option value="number">Number Input</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                    </select>
                    <button onClick={addField} className="btn-success btn-sm">+ Add Field</button>
                </div>
            )}
        </div>
    );
}
