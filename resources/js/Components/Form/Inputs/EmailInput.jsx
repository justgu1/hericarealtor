export default function EmailInput({ placeholder, id, name }) {
    return (
        <input type="email" placeholder={placeholder} id={id} name={name ?? id} />
    );
}