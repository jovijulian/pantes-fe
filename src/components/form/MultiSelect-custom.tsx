import React from "react";
import ReactSelect, {
    components,
    OptionsOrGroups,
    GroupBase,
    GetOptionLabel,
    InputActionMeta,
    ActionMeta,
    DropdownIndicatorProps,
} from "react-select";
import { IoCloseCircleSharp, IoInformationCircle } from "react-icons/io5";
import { BiChevronDown } from "react-icons/bi";

function MultiSelect(props: {
    menuIsOpen?: boolean;
    disabled?: boolean;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    isLoading?: boolean;
    options?: OptionsOrGroups<any, GroupBase<any>>;
    getOptionLabel?: GetOptionLabel<any>;
    isClearable?: boolean;
    onInputChange?: (newValue: string, actionMeta: InputActionMeta) => void;
    placeholder?: any;
    value: any;
    onValueChange?: (newValue: any, actionMeta: ActionMeta<any>) => void;
    children?: any;
    disableMessage?: any;
    invalid?: any;
    invalidKey?: React.Key | null;
    warnMessage?: any;
    menuPlacement?: "auto" | "bottom" | "top";
    icon?: any;
}) {
    const icon = props.icon;
    const ClearIndicator = (props: any) => {
        const {
            innerProps: { ref, ...restInnerProps },
        } = props;
        return (
            <div {...restInnerProps}>
                <div className="pr-1 close-select">
                    <IoCloseCircleSharp className="w-4 translate-y-[1px] fill-red-300 hover:fill-red-600 cursor-pointer close-select" />
                </div>
            </div>
        );
    };
    const DropdownIndicator = (props: DropdownIndicatorProps) => {
        return (
            <components.DropdownIndicator {...props}>
                {icon ? icon : <BiChevronDown className="text-xl" />}
            </components.DropdownIndicator>
        );
    };

    return (
        <>
            <ReactSelect
                menuPosition="absolute"
                menuPlacement={props.menuPlacement}
                defaultValue={props.value}
                components={{ ClearIndicator, DropdownIndicator }}
                menuIsOpen={props.menuIsOpen}
                isDisabled={props.disabled}
                onBlur={props.onBlur}
                isMulti={true}
                isLoading={props.isLoading}
                options={props.options}
                getOptionLabel={props.getOptionLabel}
                isClearable={props.isClearable}
                onInputChange={props.onInputChange}
                placeholder={props.placeholder}
                closeMenuOnSelect={false}
                value={props.value}
                loadingMessage={() => "Sedang mencari data..."}
                classNamePrefix="select-r"
                noOptionsMessage={({ inputValue }: any) => (
                    <span className="text-red-400">
                        <IoInformationCircle className="inline text-lg fill-red-500" /> pilihan tidak ditemukan
                    </span>
                )}
                onChange={props.onValueChange}
                className={`select-r ${props.invalid ? "is-invalid" : ""}`}
            />
            {props.children}
            {!props.disableMessage && props.invalid && (
                <div className="h-5">
                    {props.invalid ? (
                        <span key={props.invalidKey} className="block text-xs text-red-600">
                            {props.invalid}
                        </span>
                    ) : (
                        ""
                    )}
                </div>
            )}
            {props.warnMessage ? <span className="">{props.warnMessage}</span> : ""}
        </>
    );
}

MultiSelect.defaultProps = {
    disabled: false,
};

export default MultiSelect;
