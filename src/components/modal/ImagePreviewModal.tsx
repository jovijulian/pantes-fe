import React from 'react';
import { FaTimes, FaDownload, FaExpand, FaCompress } from 'react-icons/fa';
import ComponentCard from "@/components/common/ComponentCard";

interface ImagePreviewModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    imageTitle?: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    isOpen,
    imageUrl,
    imageTitle = "Image Preview",
    onClose
}) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    if (!isOpen || !imageUrl) return null;

    // Daftar ekstensi video yang didukung
    const videoExtensions = ['.webm', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.3gp', '.m4v'];
    // Cek apakah URL mengandung salah satu ekstensi video (case-insensitive)
    const isVideoContent = videoExtensions.some(ext => imageUrl.toLowerCase().endsWith(ext));

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        // Ambil ekstensi dari URL
        let ext = imageUrl.substring(imageUrl.lastIndexOf('.'));
        if (!ext) ext = isVideoContent ? '.mp4' : '.jpg';
        link.download = `${imageTitle.replace(/\s+/g, '_')}_${Date.now()}${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target == e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed mt-7 inset-0 flex items-center justify-center z-50 p-2"
            onClick={handleBackdropClick}
        >
            <div
                className={`relative transition-all duration-300 ${isFullscreen ? 'w-full h-full max-w-none max-h-none' : 'w-full max-w-xl max-h-[90vh]'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <ComponentCard title={imageTitle}  className="h-full flex flex-col">
                    {/* Modal Header with Actions */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                                High Resolution {isVideoContent ? 'Video' : 'Image'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                title="Download"
                            >
                                <FaDownload className="w-4 h-4" />
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Close"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Media Container */}
                    <div className="relative bg-gray-50 rounded-lg flex-1 overflow-hidden flex items-center justify-center">
                        {isVideoContent ? (
                            <video
                                src={imageUrl}
                                controls
                                autoPlay
                                // #3: Biarkan gambar mengisi parent-nya yang sekarang sudah fleksibel
                                className="object-contain w-full h-[48vh]" 
                            />
                        ) : (
                            <img
                                src={imageUrl}
                                alt={imageTitle}
                                // #3: Biarkan gambar mengisi parent-nya yang sekarang sudah fleksibel
                                className="object-contain w-full h-[48vh]"
                            />
                        )}
                    </div>


                    {/* Modal Footer */}
                    <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                                <span>Original size maintained</span>
                                <span>•</span>
                                <span>{'Right-click to save'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Press ESC to close</span>
                            </div>
                        </div>
                    </div>
                </ComponentCard>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
