// "use client"
// import React, { useState, useEffect } from 'react';
// import { Plus, Trash2, User, ShoppingCart, Calculator, ChevronDown, ChevronUp, Calendar, Package, Gift, Star } from 'lucide-react';
// import _ from 'lodash';
// import SingleDatePicker from '@/components/common/SingleDatePicker';
// import Input from '@/components/form/input/InputField';

// // Mock Data untuk Dropdown
// const jenisBarangOptions = [
//   { value: '1', label: 'Anting' },
//   { value: '2', label: 'Cincin' },
//   { value: '3', label: 'Gelang' },
// ];
// const modelOptions = {
//   '1': [{ value: '101', label: 'Listring' }, { value: '102', label: 'Tusuk' }],
//   '2': [{ value: '201', label: 'Solitaire' }, { value: '202', label: 'Trilogy' }],
//   '3': [{ value: '301', label: 'Bangle' }, { value: '302', label: 'Rantai' }],
// };
// const treatmentOptions = [
//   { value: '1', label: 'Minuman Segar' },
//   { value: '2', label: 'Merchandise Payung' },
//   { value: '3', label: 'Voucher Diskon 10%' },
//   { value: '4', label: 'Complimentary Cleaning' },
//   { value: '5', label: 'Free Gift Wrap' },
// ];
// const penghargaanOptions = [
//   { value: '1', label: 'MCM' },
//   { value: '2', label: 'Blender' },
//   { value: '3', label: 'Saucepan' },
//   { value: '4', label: 'Shopping Voucher' },
//   { value: '5', label: 'Jewelry Box' },
// ];
// const mockCustomers = [
//   {
//     id: 1,
//     nama_konsumen: 'ROSITA',
//     no_hp: '087876420707',
//     alamat: 'Karawaci, Kebon Jati 001/001, Bojong Jaya',
//     tanggal_lahir: '1977-12-12',
//     detail_konsumen: 'Auditor Perusahaan Swasta',
//     tgl_anniv: '2025-09-22',
//   }
// ];

// // Custom Input Component
// // Custom Select Component
// const Select = ({ placeholder, options, value, onValueChange, disabled = false }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="relative">
//       <button
//         type="button"
//         onClick={() => !disabled && setIsOpen(!isOpen)}
//         disabled={disabled}
//         className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left bg-white hover:border-gray-300 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-between"
//       >
//         <span className={value ? "text-gray-900" : "text-gray-500"}>
//           {value?.label || placeholder}
//         </span>
//         <ChevronDown className="h-5 w-5 text-gray-400" />
//       </button>
//       {isOpen && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
//           {options.map((option) => (
//             <button
//               key={option.value}
//               type="button"
//               onClick={() => {
//                 onValueChange(option);
//                 setIsOpen(false);
//               }}
//               className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
//             >
//               {option.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // Custom MultiSelect Component
// const MultiSelect = ({ placeholder, options, value, onValueChange }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [newOption, setNewOption] = useState('');

//   const toggleOption = (option) => {
//     const isSelected = value.some(v => v.value === option.value);
//     if (isSelected) {
//       onValueChange(value.filter(v => v.value !== option.value));
//     } else {
//       onValueChange([...value, option]);
//     }
//   };

//   const addNewOption = () => {
//     if (newOption.trim() && !options.some(opt => opt.label.toLowerCase() === newOption.toLowerCase())) {
//       const newOpt = { value: `new_${Date.now()}`, label: newOption.trim() };
//       onValueChange([...value, newOpt]);
//       setNewOption('');
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         type="button"
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left bg-white hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
//       >
//         {value.length > 0 ? (
//           <div className="flex flex-wrap gap-1">
//             {value.map((item) => (
//               <span key={item.value} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
//                 {item.label}
//               </span>
//             ))}
//           </div>
//         ) : (
//           <span className="text-gray-500">{placeholder}</span>
//         )}
//       </button>
//       {isOpen && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
//           <div className="p-3 border-b border-gray-200">
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={newOption}
//                 onChange={(e) => setNewOption(e.target.value)}
//                 placeholder="Add new option..."
//                 className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
//                 onKeyPress={(e) => e.key === 'Enter' && addNewOption()}
//               />
//               <button
//                 type="button"
//                 onClick={addNewOption}
//                 className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
//               >
//                 Add
//               </button>
//             </div>
//           </div>
//           <div className="max-h-48 overflow-auto">
//             {options.map((option) => {
//               const isSelected = value.some(v => v.value === option.value);
//               return (
//                 <label key={option.value} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={isSelected}
//                     onChange={() => toggleOption(option)}
//                     className="mr-3 text-blue-600"
//                   />
//                   {option.label}
//                 </label>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Interface untuk struktur data
// interface Customer {
//   id: number;
//   nama_konsumen: string;
//   no_hp: string;
//   alamat: string;
//   tanggal_lahir: string;
//   detail_konsumen: string;
//   tgl_anniv: string;
// }

// interface TransactionItem {
//   id: string;
//   tanggal_transaksi: string;
//   jenis_barang: string;
//   model: string;
//   harga: number;
//   keterangan: string;
//   treatment_privilege: (string | number)[];
//   penghargaan_saat_beli: (string | number)[];
//   penghargaan_visit_selanjutnya: string;
//   program_loyalty: string;
//   konten_edukasi: string;
//   konten_bangga_diamond: string;
//   konten_member_eksklusif: string;
//   konten_influencer: string;
// }

// interface CreateTransactionData {
//   customer_id?: number;
//   customer_data: {
//     nama_konsumen: string;
//     no_hp: string;
//     alamat: string;
//     tanggal_lahir: string;
//     detail_konsumen: string;
//     tgl_anniv?: string;
//   };
//   items: TransactionItem[];
//   total_amount: number;
//   catatan_umum?: string;
// }

// const formatDateToString = (date: Date | null): string => {
//   if (!date) return '';
//   const offset = date.getTimezoneOffset();
//   const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
//   return adjustedDate.toISOString().split('T')[0];
// };

// export default function CreateTransactionAdvancedFixedPage() {
//   const [formData, setFormData] = useState<CreateTransactionData>({
//     customer_data: {
//       nama_konsumen: '',
//       no_hp: '',
//       alamat: '',
//       tanggal_lahir: '',
//       detail_konsumen: '',
//       tgl_anniv: ''
//     },
//     items: [],
//     total_amount: 0,
//     catatan_umum: ''
//   });

//   const [customerFound, setCustomerFound] = useState<Customer | null>(null);
//   const [isNewCustomer, setIsNewCustomer] = useState(true);
//   const [searchingCustomer, setSearchingCustomer] = useState(false);
//   const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
//   const [openItemId, setOpenItemId] = useState<string | null>(null);

//   const toggleItemAccordion = (itemId: string) => {
//     setOpenItemId(prevId => (prevId === itemId ? null : itemId));
//   };

//   const searchCustomerByPhone = (phone: string) => {
//     if (!phone.trim()) {
//       setCustomerFound(null);
//       setIsNewCustomer(true);
//       return;
//     }
//     setSearchingCustomer(true);
//     setTimeout(() => {
//       const customer = mockCustomers.find(c => c.no_hp === phone.replace(/\D/g, ''));
//       if (customer) {
//         setCustomerFound(customer);
//         setIsNewCustomer(false);
//         setFormData(prev => ({ ...prev, customer_id: customer.id, customer_data: { ...customer } }));
//       } else {
//         setCustomerFound(null);
//         setIsNewCustomer(true);
//         setFormData(prev => ({ ...prev, customer_id: undefined, customer_data: { nama_konsumen: '', no_hp: phone, alamat: '', tanggal_lahir: '', detail_konsumen: '', tgl_anniv: '' } }));
//       }
//       setSearchingCustomer(false);
//     }, 800);
//   };

//   const handleCustomerDataChange = (field: keyof CreateTransactionData['customer_data'], value: string) => {
//     setFormData(prev => ({ ...prev, customer_data: { ...prev.customer_data, [field]: value } }));
//   };

//   const addTransactionItem = () => {
//     const newItem: TransactionItem = {
//       id: Date.now().toString(),
//       tanggal_transaksi: new Date().toISOString().split('T')[0],
//       jenis_barang: '',
//       model: '',
//       harga: 0,
//       keterangan: '',
//       treatment_privilege: [],
//       penghargaan_saat_beli: [],
//       penghargaan_visit_selanjutnya: '',
//       program_loyalty: '',
//       konten_edukasi: '',
//       konten_bangga_diamond: '',
//       konten_member_eksklusif: '',
//       konten_influencer: '',
//     };
//     const newItems = [...formData.items, newItem];
//     setFormData(prev => ({ ...prev, items: newItems }));
//     setOpenItemId(newItem.id);
//   };

//   const updateTransactionItem = (id: string, field: keyof TransactionItem, value: any) => {
//     let newItems = formData.items.map(item => (item.id === id ? { ...item, [field]: value } : item));
//     if (field === 'jenis_barang') {
//       newItems = newItems.map(item => (item.id === id ? { ...item, model: '' } : item));
//     }
//     setFormData(prev => ({ ...prev, items: newItems }));
//   };

//   const removeTransactionItem = (id: string) => {
//     setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
//   };

//   useEffect(() => {
//     const total = formData.items.reduce((sum, item) => sum + Number(item.harga), 0);
//     setFormData(prev => ({ ...prev, total_amount: total }));
//   }, [formData.items]);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log('Final Transaction Data:', formData);
//     // Di aplikasi nyata, Anda akan mengirimkan data ini ke API
//     alert('Transaction created successfully! Check the console log for data.');
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
//           <div className="flex items-center space-x-4">
//             <div className="bg-blue-600 p-3 rounded-lg"><ShoppingCart className="h-8 w-8 text-white" /></div>
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Create New Transaction</h1>
//               <p className="text-gray-600 mt-1">Search or input customer data, then add transaction items.</p>
//             </div>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//             <div className="xl:col-span-2 space-y-6">
//               {/* Customer Information Section */}
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
//                 <div className="flex items-center mb-6">
//                   <div className="bg-blue-600 p-2 rounded-lg mr-4"><User className="h-6 w-6 text-white" /></div>
//                   <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
//                 </div>
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 mb-3">Customer Phone Number</label>
//                   <div className="relative">
//                     <Input type="text" defaultValue={formData.customer_data.no_hp}
//                       onChange={(e) => {
//                         handleCustomerDataChange('no_hp', e.target.value);
//                         searchCustomerByPhone(e.target.value);
//                       }}
//                       placeholder="Enter phone number to search..." />
//                     {searchingCustomer && <div className="absolute right-4 top-1/2 transform -translate-y-1/2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div></div>}
//                   </div>
//                 </div>
//                 {formData.customer_data.no_hp && (
//                   <div className="mb-6">
//                     {customerFound ? (
//                       <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center text-green-800">
//                         <User className="h-4 w-4 mr-3" /> <span className="font-semibold">Customer Found! </span> Data has been auto-filled.
//                       </div>
//                     ) : isNewCustomer && !searchingCustomer ? (
//                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center text-blue-800">
//                         <Plus className="h-5 w-5 mr-3" /> <span className="font-semibold">New Customer,</span> please complete the details below.
//                       </div>
//                     ) : null}
//                   </div>
//                 )}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Customer Name *</label>
//                     <Input type="text" defaultValue={formData.customer_data.nama_konsumen} onChange={(e) => handleCustomerDataChange('nama_konsumen', e.target.value)} disabled={!!customerFound} placeholder="Full name" required />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Date of Birth</label>
//                     <SingleDatePicker placeholderText="Select date of birth" selectedDate={formData.customer_data.tanggal_lahir ? new Date(formData.customer_data.tanggal_lahir) : null} onChange={(date: any) => handleCustomerDataChange('tanggal_lahir', formatDateToString(date))} onClearFilter={() => handleCustomerDataChange('tanggal_lahir', '')} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} maxDate={new Date()} />
//                   </div>
//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Address</label>
//                     <textarea value={formData.customer_data.alamat} onChange={(e) => handleCustomerDataChange('alamat', e.target.value)} disabled={!!customerFound} placeholder="Full address" rows={2}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Customer Details</label>
//                     <Input type="text" defaultValue={formData.customer_data.detail_konsumen} onChange={(e) => handleCustomerDataChange('detail_konsumen', e.target.value)} disabled={!!customerFound} placeholder="Example: Auditor, VIP Customer" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">Anniversary Date</label>
//                     <SingleDatePicker placeholderText="Select anniversary date" selectedDate={formData.customer_data.tgl_anniv ? new Date(formData.customer_data.tgl_anniv) : null} onChange={(date) => handleCustomerDataChange('tgl_anniv', formatDateToString(date))} onClearFilter={() => handleCustomerDataChange('tgl_anniv', '')} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} maxDate={new Date()} />
//                   </div>
//                 </div>
//               </div>

//               {/* Transaction Items Section */}
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center">
//                     <div className="bg-blue-600 p-2 rounded-lg mr-4"><ShoppingCart className="h-6 w-6 text-white" /></div>
//                     <h2 className="text-xl font-bold text-gray-900">Transaction Items</h2>
//                   </div>
//                   <button type="button" onClick={addTransactionItem} className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm">
//                     <Plus className="h-5 w-5 mr-2" />Add Item
//                   </button>
//                 </div>

//                 {formData.items.length === 0 ? (
//                   <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
//                     <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
//                     <p className="text-lg text-gray-500">No items have been added yet.</p>
//                     <p className="text-gray-400 text-sm mt-2">Click "Add Item" to start adding transaction items</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-6">
//                     {formData.items.map((item, index) => (
//                       <div key={item.id} className="bg-white rounded-lg border-2 border-gray-200 transition-all duration-300 hover:border-gray-300">
//                         {/* Item Header */}
//                         <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => toggleItemAccordion(item.id)}>
//                           <div className="flex items-center space-x-4">
//                             <div className="bg-blue-100 p-2 rounded-full">
//                               <Package className="h-5 w-5 text-blue-600" />
//                             </div>
//                             <div>
//                               <span className="text-lg font-bold text-gray-800">Item #{index + 1}</span>
//                               {item.jenis_barang && (
//                                 <div className="flex items-center mt-1 space-x-2">
//                                   <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
//                                     {_.find(jenisBarangOptions, { value: item.jenis_barang })?.label}
//                                   </span>
//                                   {item.model && (
//                                     <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
//                                       {_.find(modelOptions[item.jenis_barang], { value: item.model })?.label}
//                                     </span>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-3">
//                             {item.harga > 0 && (
//                               <span className="text-lg font-bold text-blue-600">{formatCurrency(item.harga)}</span>
//                             )}
//                             <button type="button" onClick={(e) => { e.stopPropagation(); removeTransactionItem(item.id); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors">
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                             {openItemId === item.id ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
//                           </div>
//                         </div>

//                         {/* Basic Item Details */}
//                         <div className="px-6 pb-6 border-b border-gray-200">
//                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                             <div>
//                               <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
//                                 <Calendar className="h-4 w-4 mr-2 text-gray-500" />
//                                 Transaction Date *
//                               </label>
//                               <SingleDatePicker placeholderText="Select transaction date" selectedDate={item.tanggal_transaksi ? new Date(item.tanggal_transaksi) : null} onChange={(date) => updateTransactionItem(item.id, 'tanggal_transaksi', formatDateToString(date))} onClearFilter={() => updateTransactionItem(item.id, 'tanggal_transaksi', '')} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} maxDate={new Date()} />
//                             </div>
//                             <div>
//                               <label className="block text-sm font-semibold text-gray-700 mb-2">Item Type *</label>
//                               <Select placeholder="Select Item Type" options={jenisBarangOptions} value={_.find(jenisBarangOptions, { value: item.jenis_barang })} onValueChange={(opt) => updateTransactionItem(item.id, 'jenis_barang', opt.value)} />
//                             </div>
//                             <div>
//                               <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
//                               <Select placeholder="Select Model" options={modelOptions[item.jenis_barang] || []} value={_.find(modelOptions[item.jenis_barang], { value: item.model })} onValueChange={(opt) => updateTransactionItem(item.id, 'model', opt.value)} disabled={!item.jenis_barang} />
//                             </div>
//                             <div>
//                               <label className="block text-sm font-semibold text-gray-700 mb-2">Price (IDR) *</label>
//                               <Input type="number" defaultValue={item.harga} onChange={(e) => updateTransactionItem(item.id, 'harga', parseFloat(e.target.value) || 0)} placeholder="1000000" required />
//                             </div>
//                             <div className="md:col-span-2">
//                               <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
//                               <Input type="text" defaultValue={item.keterangan} onChange={(e) => updateTransactionItem(item.id, 'keterangan', e.target.value)} placeholder="Additional notes about this item" />
//                             </div>
//                           </div>
//                         </div>

//                         {/* Expanded Details */}
//                         {openItemId === item.id && (
//                           <div className="p-6 bg-gray-50">
//                             {/* Privilege & Awards Section */}
//                             <div className="mb-8">
//                               <div className="flex items-center mb-6">
//                                 <Gift className="h-5 w-5 text-blue-600 mr-2" />
//                                 <h4 className="text-lg font-bold text-gray-800">Privilege & Awards</h4>
//                               </div>
//                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Treatment Privilege (Multiple Selection)</label>
//                                   <MultiSelect
//                                     placeholder="Select treatments or add new..."
//                                     options={treatmentOptions}
//                                     value={treatmentOptions.filter(opt => item.treatment_privilege.includes(opt.value))}
//                                     onValueChange={(opts) => updateTransactionItem(item.id, 'treatment_privilege', opts.map(o => o.value))}
//                                   />
//                                   <p className="text-xs text-gray-500 mt-1">You can select multiple treatments or add new ones</p>
//                                 </div>
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Award at Purchase (Multiple Selection)</label>
//                                   <MultiSelect
//                                     placeholder="Select awards..."
//                                     options={penghargaanOptions}
//                                     value={penghargaanOptions.filter(opt => item.penghargaan_saat_beli.includes(opt.value))}
//                                     onValueChange={(opts) => updateTransactionItem(item.id, 'penghargaan_saat_beli', opts.map(o => o.value))}
//                                   />
//                                   <p className="text-xs text-gray-500 mt-1">Awards given immediately at purchase</p>
//                                 </div>
//                                 <div className="md:col-span-2">
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Next Visit Award</label>
//                                   <Input type="text" defaultValue={item.penghargaan_visit_selanjutnya} onChange={(e) => updateTransactionItem(item.id, 'penghargaan_visit_selanjutnya', e.target.value)} placeholder="e.g., 50k Voucher, Free Maintenance" />
//                                   <p className="text-xs text-gray-500 mt-1">Special award for the next visit</p>
//                                 </div>
//                               </div>
//                             </div>

//                             {/* Content & Programs Section */}
//                             <div>
//                               <div className="flex items-center mb-6">
//                                 <Star className="h-5 w-5 text-blue-600 mr-2" />
//                                 <h4 className="text-lg font-bold text-gray-800">Content & Programs</h4>
//                               </div>
//                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Loyalty Program</label>
//                                   <Input type="text" defaultValue={item.program_loyalty} onChange={(e) => updateTransactionItem(item.id, 'program_loyalty', e.target.value)} placeholder="e.g., Point Reward, Membership Tier" />
//                                 </div>
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Educational Content</label>
//                                   <Input type="text" defaultValue={item.konten_edukasi} onChange={(e) => updateTransactionItem(item.id, 'konten_edukasi', e.target.value)} placeholder="e.g., Diamond 4C, Gold Purity" />
//                                 </div>
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Diamond Pride Content</label>
//                                   <Input type="text" defaultValue={item.konten_bangga_diamond} onChange={(e) => updateTransactionItem(item.id, 'konten_bangga_diamond', e.target.value)} placeholder="e.g., Investment Value, Rarity" />
//                                 </div>
//                                 <div>
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Exclusive Member Content</label>
//                                   <Input type="text" defaultValue={item.konten_member_eksklusif} onChange={(e) => updateTransactionItem(item.id, 'konten_member_eksklusif', e.target.value)} placeholder="e.g., Private Sale Invite" />
//                                 </div>
//                                 <div className="md:col-span-2">
//                                   <label className="block text-sm font-semibold text-gray-700 mb-3">Influencer Content</label>
//                                   <Input type="text" defaultValue={item.konten_influencer} onChange={(e) => updateTransactionItem(item.id, 'konten_influencer', e.target.value)} placeholder="e.g., Mentioned by @influencer_name" />
//                                 </div>
//                               </div>
//                             </div>

//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Right Column for Summary */}
//             <div className="xl:col-span-1">
//               <div className="sticky top-6 space-y-6">
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
//                   <div className="flex items-center mb-6">
//                     <div className="bg-blue-600 p-2 rounded-lg mr-4"><Calculator className="h-6 w-6 text-white" /></div>
//                     <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
//                   </div>
//                   <div className="space-y-4">
//                     <div className="flex justify-between items-center text-gray-600">
//                       <span>Subtotal ({formData.items.length} items)</span>
//                       <span className="font-semibold text-gray-800">{formatCurrency(formData.total_amount)}</span>
//                     </div>
//                     <div className="border-t-2 border-dashed my-4"></div>
//                     <div className="flex justify-between items-center text-2xl font-bold">
//                       <span className="text-gray-900">Total</span>
//                       <span className="text-blue-600">{formatCurrency(formData.total_amount)}</span>
//                     </div>
//                   </div>
//                   <div className="mt-8">
//                     <label className="block text-sm font-semibold text-gray-700 mb-3">General Notes</label>
//                     <textarea
//                       value={formData.catatan_umum}
//                       onChange={(e) => setFormData(prev => ({ ...prev, catatan_umum: e.target.value }))}
//                       placeholder="Add any general notes for this entire transaction..."
//                       rows={4}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
//                     />
//                   </div>
//                   <div className="mt-8">
//                     <button
//                       type="submit"
//                       className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg text-lg flex items-center justify-center disabled:bg-gray-400"
//                       disabled={!formData.customer_data.nama_konsumen || formData.items.length === 0}
//                     >
//                       Create Transaction
//                     </button>
//                     <p className="text-xs text-gray-500 text-center mt-3">
//                       Ensure all required (*) fields are filled before submitting.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
