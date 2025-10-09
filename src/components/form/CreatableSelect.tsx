"use-client";
import React from 'react';
import Creatable from 'react-select/creatable';

// Opsi props: options, value, onChange, onCreateOption, placeholder, disabled
export default function CreatableSelect({ onCreateOption, ...props }: any) {
    // Styling agar mirip dengan komponen Anda yang lain
    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            '&:hover': {
                borderColor: '#d1d5db',
            }
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        menu: (base: any) => ({ ...base, zIndex: 9999 })
    };

    return (
        <Creatable
            {...props}
            onCreateOption={onCreateOption}
            formatCreateLabel={(inputValue) => `Add new: "${inputValue}"`}
            styles={customStyles}
            isClearable
            isMulti
        />
    );
}