export default function TextArea(data){
    return(
        <textarea placeholder={data.placeholder} maxLength={data.maxLength} minLength={data.minLength} id={data.id} name={data.name}>{data.value}</textarea>
    );
}