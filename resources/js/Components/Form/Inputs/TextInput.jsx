export default function TextInput(data){
    return(
        <input type="text" placeholder={data.placeholder} value={data.value} maxLength={data.maxLength} minLength={data.minLength} id={data.id} name={data.name} />
    );
}