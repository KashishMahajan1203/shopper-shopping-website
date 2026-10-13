import React, { useState } from "react";
import "./AddressForm.css";

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

const FIELDS = [
  { name: "fullName", label: "Full name", autoComplete: "name", wide: true },
  { name: "phone", label: "Mobile number", autoComplete: "tel", inputMode: "numeric", maxLength: 10, pattern: "[6-9][0-9]{9}", title: "10-digit mobile number" },
  { name: "pincode", label: "Pincode", autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, pattern: "[0-9]{6}", title: "6-digit pincode" },
  { name: "line1", label: "House no., building, street", autoComplete: "address-line1", wide: true },
  { name: "line2", label: "Area, landmark (optional)", autoComplete: "address-line2", wide: true, optional: true },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
];

const AddressForm = ({ onSubmit, onCancel, saving }) => {
  const [values, setValues] = useState(EMPTY);
  const [isDefault, setIsDefault] = useState(false);

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  return (
    <form
      className="address-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...values, isDefault });
      }}
    >
      {FIELDS.map(({ name, label, wide, optional, ...rest }) => (
        <label key={name} className={wide ? "wide" : ""}>
          {label}
          <input
            className="input"
            name={name}
            value={values[name]}
            onChange={handleChange}
            required={!optional}
            {...rest}
          />
        </label>
      ))}
      <label className="address-form-default wide">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Make this my default address
      </label>
      <div className="address-form-actions wide">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save address"}
        </button>
        {onCancel && (
          <button className="btn btn-outline" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
