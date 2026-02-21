"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { alertToast, endpointUrl, httpGet, httpPost } from '@/../helpers';
import Select from '@/components/form/Select-custom';
import { Loader2, Plus, Save, Trash2, Info, ShoppingCart } from 'lucide-react';
import _ from "lodash";

interface SelectOption { value: string; label: string; }

interface IExistingItem {
    id: number;
    pcs: string;
    kadar: string;
    bruto: string;
    disc: string;
}

interface IItemFormState {
    order_id: number | null;
    order_item_id: number | null;
}

interface IItemInList {
    id: string; // Unique local ID untuk render list
    order_item_id: number;
    no_order: string;
    item_name: string;
    weight: number;
    pcs: number;
    nominal: number;
}

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: number;
    onSuccess: () => void;
    baseNominal: number;
    baseTotalWeight: number;
    existingItems: IExistingItem[];
    type: string;
}

const AddItemWorkOrderModal: React.FC<AddItemModalProps> = ({
    isOpen,
    onClose,
    workOrderId,
    onSuccess,
    baseNominal,
    baseTotalWeight,
    type
}) => {
    const [itemPOOptions, setItemPOOptions] = useState<SelectOption[]>([]);
    const [ordersData, setOrdersData] = useState<any[]>([]); 
    
    // State untuk Order Items (Ditarik setelah PO dipilih)
    const [orderItemsData, setOrderItemsData] = useState<any[]>([]);
    const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);
    
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [form, setForm] = useState<IItemFormState>({ order_id: null, order_item_id: null });
    const [itemsList, setItemsList] = useState<IItemInList[]>([]);

    const formatRupiah = (val: number | string) => "Rp " + Number(val).toLocaleString('id-ID');
    const formatGram = (val: number | string) => Number(val).toLocaleString('id-ID') + " gr";

    useEffect(() => {
        if (isOpen) {
            const fetchOrder = async () => {
                setLoadingOptions(true);
                try {
                    const res = await httpGet(endpointUrl(`work-order/${workOrderId}/get-order`), true, { type: type });
                    setOrdersData(res.data.data);
                    setItemPOOptions(res.data.data.map((i: any) => ({
                        value: i.id.toString(),
                        label: `${i.no_order}`,
                    })));
                } catch (error) {
                    toast.error("Gagal memuat pesanan (PO).");
                } finally {
                    setLoadingOptions(false);
                }
            }
            fetchOrder();
        } else {
            // Reset saat modal ditutup
            setItemsList([]);
            setForm({ order_id: null, order_item_id: null });
            setOrderItemsData([]);
            setItemOptions([]);
        }
    }, [isOpen, workOrderId, type]);

    // Fetch Order Items ketika user memilih PO
    useEffect(() => {
        if (form.order_id) {
            const fetchOrderItems = async () => {
                setIsLoadingItems(true);
                try {
                    // Tarik detail PO untuk mendapatkan barang di dalamnya
                    const res = await httpGet(endpointUrl(`purchase/order/${form.order_id}`), true);
                    const items = res.data.data.order_items || [];
                    setOrderItemsData(items);
                    
                    setItemOptions(items.map((i: any) => ({
                        value: i.id.toString(),
                        label: `${i.name_item}`,
                    })));
                } catch (error) {
                    toast.error("Gagal memuat daftar barang dari PO ini.");
                    setOrderItemsData([]);
                    setItemOptions([]);
                } finally {
                    setIsLoadingItems(false);
                }
            };
            fetchOrderItems();
            setForm(prev => ({ ...prev, order_item_id: null })); // Reset pilihan barang jika PO berubah
        } else {
            setOrderItemsData([]);
            setItemOptions([]);
            setForm(prev => ({ ...prev, order_item_id: null }));
        }
    }, [form.order_id]);

    const handleFormChange = (field: keyof IItemFormState, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItemToList = () => {
        if (!form.order_id) return toast.error("Harap pilih No Pesanan (PO) terlebih dahulu.");
        if (!form.order_item_id) return toast.error("Harap pilih Barang terlebih dahulu.");

        // Cek duplikasi
        if (itemsList.some(item => item.order_item_id === form.order_item_id)) {
            return toast.error("Barang ini sudah ada di dalam list.");
        }

        const activeOrder = ordersData.find(o => o.id.toString() === form.order_id?.toString());
        const activeItem = orderItemsData.find(i => i.id.toString() === form.order_item_id?.toString());
        
        if (activeOrder && activeItem) {
            const newItem: IItemInList = {
                id: `item-${Date.now()}`,
                order_item_id: activeItem.id,
                no_order: activeOrder.no_order,
                item_name: activeItem.name_item,
                weight: Number(activeItem.weight),
                pcs: Number(activeItem.pcs),
                nominal: Number(activeItem.total_nominal || (activeItem.nominal * activeItem.pcs))
            };

            setItemsList(prev => [...prev, newItem]);
            setForm(prev => ({ ...prev, order_item_id: null })); // Reset dropdown barang agar bisa milih yang lain
            toast.success("Barang ditambahkan ke list.");
        }
    };

    const handleRemoveItemFromList = (id: string) => {
        setItemsList(prev => prev.filter(item => item.id !== id));
    };

    const handleConfirmSubmit = async () => {
        if (itemsList.length === 0) {
            return toast.error("List barang tidak boleh kosong. Harap tambahkan minimal 1 barang.");
        }

        setIsSubmitting(true);

        // Bentuk Payload Baru: { "items": [ { "order_item_id": 1 } ] }
        const payload = {
            items: itemsList.map(item => ({
                order_item_id: item.order_item_id
            }))
        };

        try {
            await httpPost(endpointUrl(`work-order/${workOrderId}/add-item`), payload, true);
            toast.success("Barang berhasil ditambahkan ke Surat Jalan!");
            onSuccess();
            onClose();
        } catch (error: any) {
            alertToast(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ambil data untuk box Info
    const activeOrderData = ordersData.find(o => o.id.toString() === form.order_id?.toString());
    const activeItemData = orderItemsData.find(i => i.id.toString() === form.order_item_id?.toString());

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
                <Transition.Child as={Fragment}>
                    <div className="fixed inset-0 h-full w-full bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment}>
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 border-b pb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                                    Tambahkan Barang (SJ)
                                </Dialog.Title>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                                    {/* FORM INPUT & INFO (KIRI) */}
                                    <div className="lg:col-span-4 space-y-4">
                                        <div className="p-4 border rounded-xl bg-gray-50 space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Pilih No Pesanan (PO)</label>
                                                <Select
                                                    options={itemPOOptions}
                                                    value={form.order_id ? _.find(itemPOOptions, { value: form.order_id.toString() }) : null}
                                                    onValueChange={(opt) => handleFormChange('order_id', opt ? parseInt(opt.value) : null)}
                                                    placeholder="Pilih order..."
                                                    disabled={loadingOptions}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-1">Pilih Barang</label>
                                                <Select
                                                    options={itemOptions}
                                                    value={form.order_item_id ? _.find(itemOptions, { value: form.order_item_id.toString() }) : null}
                                                    onValueChange={(opt) => handleFormChange('order_item_id', opt ? parseInt(opt.value) : null)}
                                                    placeholder={isLoadingItems ? "Memuat barang..." : !form.order_id ? "Pilih PO dulu..." : "Pilih jenis barang..."}
                                                    disabled={loadingOptions || isLoadingItems || !form.order_id || itemOptions.length === 0}
                                                />
                                            </div>

                                            {/* BOX INFO BARANG */}
                                            {(activeOrderData || activeItemData) && (
                                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                                    <div className="flex items-center gap-1.5 font-semibold mb-2 pb-2 border-b border-blue-200">
                                                        <Info className="w-4 h-4" /> Info Target PO
                                                    </div>
                                                    
                                                    {activeOrderData && !activeItemData && (
                                                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                                                            <div><span className="text-blue-600/70 block">Total Berat PO</span><span className="font-medium">{formatGram(activeOrderData.weight)}</span></div>
                                                            <div><span className="text-blue-600/70 block">Total PCS PO</span><span className="font-medium">{activeOrderData.pcs} Pcs</span></div>
                                                            <div className="col-span-2"><span className="text-blue-600/70 block">Total Nominal PO</span><span className="font-medium">{formatRupiah(activeOrderData.nominal)}</span></div>
                                                        </div>
                                                    )}

                                                    {activeItemData && (
                                                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                                                            <div><span className="text-blue-600/70 block">Berat Barang</span><span className="font-medium">{formatGram(activeItemData.weight)}</span></div>
                                                            <div><span className="text-blue-600/70 block">Jumlah Pcs</span><span className="font-medium">{activeItemData.pcs} Pcs</span></div>
                                                            <div className="col-span-2"><span className="text-blue-600/70 block">Nominal Barang</span><span className="font-medium">{formatRupiah(activeItemData.total_nominal || (activeItemData.nominal * activeItemData.pcs))}</span></div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleAddItemToList}
                                                disabled={!form.order_id || !form.order_item_id}
                                                className="w-full mt-2 px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Tambah ke List
                                            </button>
                                        </div>
                                        
                                        {/* INFO TARGET WO GENERAL */}
                                        {/* <div className="p-4 border rounded-xl bg-gray-50">
                                            <h4 className="font-semibold text-sm mb-3 text-gray-700">Ringkasan Surat Jalan</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Target Berat</span>
                                                    <span className="font-semibold text-gray-800">{formatGram(baseTotalWeight)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Target Nominal</span>
                                                    <span className="font-semibold text-blue-600">{formatRupiah(baseNominal)}</span>
                                                </div>
                                            </div>
                                        </div> */}
                                    </div>

                                    {/* LIST BARANG (KANAN) */}
                                    <div className="lg:col-span-8">
                                        <div className="border rounded-xl h-full flex flex-col">
                                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center rounded-t-xl">
                                                <h4 className="font-semibold text-gray-800">Daftar Barang ({itemsList.length})</h4>
                                            </div>
                                            
                                            <div className="flex-1 max-h-[400px] overflow-y-auto p-0">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PO</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Barang</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Berat</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Nominal</th>
                                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-16">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {itemsList.length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="text-center p-8 text-gray-400">
                                                                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                                    <p className="text-sm">Belum ada barang yang ditambahkan ke list.</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {itemsList.map((item) => (
                                                            <tr key={item.id} className="hover:bg-gray-50/50">
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-700">{item.no_order}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-800">{item.item_name} <span className="text-gray-400 text-xs ml-1">({item.pcs} Pcs)</span></td>
                                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-600">{formatGram(item.weight)}</td>
                                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">{formatRupiah(item.nominal)}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveItemFromList(item.id)}
                                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                                        title="Hapus dari List"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                                        onClick={handleConfirmSubmit}
                                        disabled={itemsList.length === 0 || isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Simpan Barang
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AddItemWorkOrderModal;