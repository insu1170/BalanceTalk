interface TextFieldProps {
    label: string;
    type?: string;
    placeholder?: string;
}

export default function TextField({
    label,
    type = "text",
    placeholder = "",
}: TextFieldProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}
