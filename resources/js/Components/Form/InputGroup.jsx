import { FaUpload } from "react-icons/fa";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";
import CreatableSelect from "react-select/creatable";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
export default function InputGroup({
    id,
    label,
    type,
    placeholder = "",
    name,
    value,
    min = 0,
    minLength = 0,
    max = 100,
    maxLength = 10240,
    accept = "",
    pattern = "",
    readonly = false,
    required = false,
    step = 1,
    multiple = false,
    options = [],
    onChange,
    defaultValue
}) {
    const [selectedDate, setSelectedDate] = useState(value || null);
    const [inputValue, setInputValue] = useState(value || "");
    const [customOptions, setCustomOptions] = useState(options);

    if (type === "multiselect") {
        return (
            <div className="InputGroup">
                <label htmlFor={id}>
                    {label}
                    <span className="required">{required ? "*" : ""}</span>
                </label>
                <CreatableSelect
                    id={id}
                    name={name}
                    options={customOptions}
                    isMulti
                    classNamePrefix="react-select"
                    onChange={onChange}
                    defaultValue={defaultValue}
                />
            </div>
        );
    }

    if (type === "select") {
        return (
            <div className="InputGroup">
                <label htmlFor={id}>
                    {label}
                    <span className="required">{required ? "*" : ""}</span>
                </label>
                <Select
                    id={id}
                    name={name}
                    options={options}
                    classNamePrefix="react-select"
                    value={options.find(option => option.value === value)}
                    onChange={(selected) => {
                        const selectedValue = selected.value;
                        onChange({ target: { name, value: selectedValue, type: type } });
                    }}
                />
            </div>
        );
    }

    if (type === "checkbox" || type === "radio") {
        return (
            <div className="InputGroup">
                <label className="required">{required ? "*" : ""}</label>
                {options.map((item, index) => (
                    <label key={item.value} className="checkbox radio">
                        <input
                            type={type}
                            id={`${id}[${index}]`}
                            name={`${name}[${index}]`}
                            value={item.value}
                            onChange={onChange}
                        />
                        {item.label}
                    </label>
                ))}
            </div>
        );
    }

    if (type === "file") {
        return (
            <div className="InputGroup">
                <div className="file-input-container">
                    <input
                        type="file"
                        id={id}
                        name={name}
                        accept="image/*"
                        onChange={onChange}
                        multiple={multiple}
                        style={{ display: "none" }}
                    />
                    <button
                        type="button"
                        className="upload-button"
                        onClick={() => document.getElementById(id).click()}
                    >
                        <FaUpload />
                        <label htmlFor={id}>
                            {label}
                            <span className="required">{required ? "*" : ""}</span>
                        </label>
                    </button>
                </div>
            </div>
        );
    }

    if (type === "simpletextarea") {
        <div className="InputGroup">
            <label htmlFor={id}>
                {label}
                <span className="required">{required ? "*" : ""}</span>
            </label>
            <textarea
                id={id}
                value={value}
                onChange={(content) => onChange({ target: { name, value: content } })}
                placeholder={placeholder}
                maxLength={maxLength}
            >

            </textarea>
        </div>
    }

    if (type === "textarea") {
        return (
            <div className="InputGroup">
                <label htmlFor={id}>
                    {label}
                    <span className="required">{required ? "*" : ""}</span>
                </label>
                <ReactQuill
                    id={id}
                    value={value}
                    onChange={(content) => onChange({ target: { name, value: content } })}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    modules={{
                        toolbar: [
                            [{ header: [1, 2, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ script: "sub" }, { script: "super" }],
                            [{ indent: "-1" }, { indent: "+1" }],
                            [{ align: [] }],
                            ["blockquote", "code-block"],
                            ["link", "image", "video"],
                            ["clean"],
                        ],
                    }}
                />
            </div>
        );
    }

    if (type === "date") {
        return (
            <div className="InputGroup">
                <label htmlFor={id}>
                    {label}
                    <span className="required">{required ? "*" : ""}</span>
                </label>
                <DatePicker
                    id={id}
                    selected={selectedDate && !isNaN(new Date(selectedDate).getTime()) ? selectedDate : null}
                    onChange={(date) => {
                        setSelectedDate(date);
                        onChange({ target: { name, value: date } });
                    }}
                    name={name}
                    maxLength={maxLength}
                    className="react-datepicker__input"
                    placeholderText={placeholder}
                    dateFormat="yyyy-MM-dd"
                    value={selectedDate ?? ''}
                />
            </div>
        );
    }

    return (
        <div className="InputGroup">
            <label htmlFor={id}>
                {label}
                <span className="required">{required ? "*" : ""}</span>
            </label>
            <input
                type={type}
                placeholder={placeholder}
                id={id}
                name={name}
                value={name === "price" || name === "tax" || name === 'max_price' || name === 'min_price' ? inputValue : value}
                min={min}
                minLength={minLength}
                max={max}
                maxLength={maxLength}
                readOnly={readonly}
                required={required}
                step={step}
                pattern={pattern || undefined}
                onChange={(e) => {

                    if (name === "price" || name === "tax" || name === 'max_price' || name === 'min_price') {
                        let val = e.target.value.replace(/[^0-9]/g, "");

                        if (val) {
                            val = parseInt(val, 10).toLocaleString("en-US");
                            val = `$${val}`;
                        } else {
                            val = "";
                        }

                        setInputValue(val);
                        onChange({ target: { name, value: val } });
                    } else {
                        setInputValue(e.target.value);
                        onChange(e);
                    }
                }}
            />
        </div>
    );
}
