export default function NumberInput({placeholder, value, step, min, max, id, name}){
    
    return(
        <input placeholder={placeholder} value={value} step={step} min={min} max={max} id={id} name={name} />
    );
}