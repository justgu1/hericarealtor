export default function CheckboxInput({element, index}) {
    const slug = element.name.replaceAll(" ", "-");
    return (
        <label htmlFor={`${slug}-${index}`} className="checkbox radio">
            {element.name}
            <input type="checkbox" id={`${slug}-${index}`} name={slug} value={element.value} />
        </label>
    );
}