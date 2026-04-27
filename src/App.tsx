import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, Copy, RefreshCw, ImageIcon, CheckCircle2, 
  MessageSquare, Clipboard, RotateCcw, Star, AlignLeft, 
  Package, Home, ChevronRight, Tag, Layout, Layers, Edit3, Camera, X, Plus, Search, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'ARO1 MULPOT PANTS',
    price: '750.000',
    oldPrice: '850.000',
    size: 'M/L/XL',
    form: 'WIDE LEG',
    description: 'Cạp quần trễ, ống siêu rộng, độ dài phủ gót\nCó 6 túi hộp nhỏ trước sau và 2 túi hộp lớn chạy dọc theo\nChất liệu: Kaki ( ít nhăn, không phai màu)',
    variants: [
      {
        color: 'Đen',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800&h=800',
        subImages: [
          'https://images.unsplash.com/photo-1624372927054-0dc89a198de3?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1594633312110-388981611796?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1594633314413-568eb2a29792?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800&h=800'
        ]
      },
      {
        color: 'Hồng Pastel',
        image: 'https://images.unsplash.com/photo-1584315260859-c7c69a6396e6?auto=format&fit=crop&q=80&w=800&h=800',
        subImages: [
          'https://images.unsplash.com/photo-1584315259795-c992c246f488?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1584311028302-39c28892400e?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1584311124823-388981611796?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1579366948929-444cb79781b1?auto=format&fit=crop&q=80&w=800&h=800'
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'AMER HENLEY CLASSIC',
    price: '440.000',
    oldPrice: '440.000',
    size: 'S/M/L/XL',
    form: 'SLIM FIT',
    description: 'Chất vải thun gân cotton cao cấp, thấm hút mồ hôi tốt\nForm dáng ôm nhẹ tôn dáng người mặc\nCổ áo phối nút gỗ vintage',
    variants: [
      {
        color: 'Trắng',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800&h=800',
        subImages: [
          'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800&h=800'
        ]
      },
      {
        color: 'Than',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&h=800',
        subImages: [
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1489008777659-ad1fc8e07097?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1503341456391-c24c7333501a?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&q=80&w=800&h=800'
        ]
      }
    ]
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState({ en: '', vi: '' });
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedVi, setCopiedVi] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingVariantIdx, setEditingVariantIdx] = useState(0);
  const [productVariantMap, setProductVariantMap] = useState<Record<string, number>>({});

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

  const formatPrice = (val: string | number) => {
    if (!val) return "";
    const cleanValue = val.toString().replace(/\D/g, "");
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImage(reader.result as string);
              setBase64Image((reader.result as string).split(',')[1]);
              setCurrentPage('home');
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleEditClick = (product: any, variantIdx: number) => {
    setEditingProduct(JSON.parse(JSON.stringify(product)));
    setEditingVariantIdx(variantIdx);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
    showToast('saved');
  };

  const addNewVariant = () => {
    if (!editingProduct) return;
    const newVariant: ProductVariant = {
      color: 'Màu mới',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800&h=800',
      subImages: [null, null, null, null]
    };
    const updatedProduct = {
      ...editingProduct,
      variants: [...editingProduct.variants, newVariant]
    };
    setEditingProduct(updatedProduct);
    setEditingVariantIdx(updatedProduct.variants.length - 1);
  };

  const handleAddProduct = () => {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct: Product = {
      id: newId,
      name: 'MÃ SẢN PHẨM MỚI',
      price: '0',
      oldPrice: '0',
      description: 'Mô tả sản phẩm...',
      size: 'M/L/XL',
      form: 'REGULAR',
      variants: [
        {
          color: 'Mặc định',
          image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800&h=800',
          subImages: [null, null, null, null]
        }
      ]
    };
    setProducts(prev => [...prev, newProduct]);
    handleEditClick(newProduct, 0);
  };

  const showToast = (type: string) => {
    setCopyToast(type);
    setTimeout(() => setCopyToast(null), 2000);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProduct = {...editingProduct};
        newProduct.variants[editingVariantIdx].image = reader.result as string;
        setEditingProduct(newProduct);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProduct = {...editingProduct};
        newProduct.variants[editingVariantIdx].subImages[index] = reader.result as string;
        setEditingProduct(newProduct);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateEditingField = (field: string, value: string) => {
    setEditingProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateEditingVariantColor = (value: string) => {
    const newProduct = {...editingProduct};
    newProduct.variants[editingVariantIdx].color = value;
    setEditingProduct(newProduct);
  };

  const generateResponse = async (isRetry = false) => {
    if (!base64Image) {
      alert("Vui lòng dán ảnh màn hình chat trước!");
      return;
    }
    setLoading(true);
    setRating(0); 
    if (!isRetry) setResponse({ en: '', vi: '' });

    const currentVariant = selectedProduct?.variants[selectedVariantIdx];
    const productInfo = selectedProduct ? 
      `Sản phẩm: ${selectedProduct.name}. Màu: ${currentVariant?.color}. Giá: ${selectedProduct.price}đ. Size: ${selectedProduct.size}. Form: ${selectedProduct.form}. Mô tả: ${selectedProduct.description}` : 
      "Gợi ý tư vấn phong cách Amer Hub (phủi bụi, nam tính, tối giản nhưng chất).";

    const systemPrompt = `Bạn là trợ lý Amer Hub. Phản hồi khách hàng cực kỳ tự nhiên, "phủi bụi", thân thiện như bạn bè đam mê thời trang.
    DỮ LIỆU SẢN PHẨM HIỆN TẠI (nếu có): ${productInfo}
    YÊU CẦU:
    - Không dùng văn mẫu robot. Không lặp lại lời chào rập khuôn.
    - Xưng "mình" - "bạn". Tuyệt đối không dùng "Dạ/Thưa".
    - Trả lời ngắn gọn, đúng trọng tâm câu hỏi trong ảnh chat.
    - Cung cấp song ngữ Anh - Việt với cùng ý nghĩa.
    - Kết quả phải là JSON định dạng { "en": "...", "vi": "..." }.`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [
            { text: `Sử dụng ảnh màn hình chat và ngữ cảnh sau: "${context}". Hãy đưa ra câu trả lời phù hợp.` },
            { inlineData: { mimeType: "image/png", data: base64Image } }
          ] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              en: { type: Type.STRING },
              vi: { type: Type.STRING }
            },
            required: ["en", "vi"]
          }
        }
      });
      
      const text = result.text;
      if (text) {
        setResponse(JSON.parse(text));
      }
    } catch (error) { 
      console.error(error);
      setResponse({ en: 'Oops, something went wrong. Let me try again.', vi: 'Lỗi rồi, để mình thử lại xem sao.' }); 
    } finally { 
      setLoading(false); 
    }
  };

  const copyResponse = (text: string, type: 'en' | 'vi') => {
    navigator.clipboard.writeText(text);
    if (type === 'en') {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } else {
      setCopiedVi(true);
      setTimeout(() => setCopiedVi(false), 2000);
    }
    showToast('copied');
  };

  const copyProductInfo = (product: any, variantIdx = 0) => {
    const variant = product.variants[variantIdx];
    const lines = product.description.split('\n').map((l: string) => `• ${l}`).join('\n');
    const priceDisplay = (product.price === product.oldPrice) 
      ? `Giá sản phẩm: ${product.price}` 
      : `Giá sản phẩm: ${product.oldPrice} giảm còn ${product.price}`;

    const textToCopy = `Sản phẩm: ${product.name} (Màu ${variant.color})\n${lines}\nSize: ${product.size}\nForm: ${product.form}\n_\n${priceDisplay}`;
    
    navigator.clipboard.writeText(textToCopy);
    showToast('info');
  };

  const copyImage = async (url: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      showToast('image');
    } catch (err) {
      window.open(url, '_blank');
      showToast('fallback');
    }
  };

  const drawCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sWidth = img.width;
    let sHeight = img.height;
    let sx = 0;
    let sy = 0;

    if (imgRatio > canvasRatio) {
      sWidth = img.height * canvasRatio;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / canvasRatio;
      sy = (img.height - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  };

  const mergeImages = async (imageUrls: string[]): Promise<Blob> => {
    const images = await Promise.all(imageUrls.map(url => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    }));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 1300; 
    
    if (images.length === 1) {
      // For high res copy, we want to ensure the canvas is at least 1300px
      const scale = Math.max(1, 1300 / Math.min(images[0].width, images[0].height));
      canvas.width = images[0].width * scale;
      canvas.height = images[0].height * scale;
      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
    } else if (images.length === 2) {
      canvas.width = size * 2;
      canvas.height = size;
      images.forEach((img, i) => drawCover(ctx, img, i * size, 0, size, size));
    } else {
      canvas.width = size * 2;
      canvas.height = size * 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      images.forEach((img, i) => {
        const x = (i % 2) * size;
        const y = Math.floor(i / 2) * size;
        drawCover(ctx, img, x, y, size, size);
      });
    }

    return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));
  };

  const copyAllSubImages = async (subImages: (string | null)[]) => {
    const validImages = subImages.filter((img): img is string => img !== null);
    if (validImages.length === 0) {
      showToast('no_images');
      return;
    }
    
    try {
      setCopyToast('processing');
      const mergedBlob = await mergeImages(validImages);
      const item = new ClipboardItem({ 'image/png': mergedBlob });
      await navigator.clipboard.write([item]);
      showToast('all_images');
    } catch (err) {
      console.error(err);
      showToast('error');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans selection:bg-apple-blue/20 selection:text-apple-blue">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-apple-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatarInput')?.click()}>
              <div className="h-10 w-10 bg-apple-secondary rounded-full flex items-center justify-center text-apple-blue overflow-hidden border border-apple-border hover:shadow-md transition-all">
                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="font-bold text-lg">A</span>}
              </div>
              <input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">Amer app</span>
              <span className="text-[10px] text-apple-secondary-text font-semibold mt-1">Smart Assistant</span>
            </div>
          </div>

          {currentPage === 'catalog' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 max-w-sm relative hidden md:block"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all placeholder:text-slate-400"
                placeholder="Search pieces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </motion.div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-full">
            <button onClick={() => setCurrentPage('home')} className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${currentPage === 'home' ? 'bg-white shadow-sm text-apple-blue' : 'text-slate-500 hover:text-slate-900'}`}>
              Assistance
            </button>
            <button onClick={() => setCurrentPage('catalog')} className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${currentPage === 'catalog' ? 'bg-white shadow-sm text-apple-blue' : 'text-slate-500 hover:text-slate-900'}`}>
              Inventory
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {currentPage === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-5 space-y-6">
                <div 
                  className="relative bg-white rounded-[32px] p-6 min-h-[380px] flex flex-col items-center justify-center transition-all cursor-pointer border border-apple-border shadow-sm hover:shadow-md group"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  {image ? (
                    <img src={image} className="max-h-[340px] w-auto rounded-2xl object-contain" alt="" />
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="mx-auto w-20 h-20 bg-apple-secondary rounded-full flex items-center justify-center border border-apple-border group-hover:scale-105 transition-transform">
                        <Clipboard className="text-apple-secondary-text" size={32} />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-lg tracking-tight">Drop Chat Screenshot</p>
                        <p className="text-apple-secondary-text text-[11px] font-medium tracking-wide">Paste image from clipboard</p>
                      </div>
                    </div>
                  )}
                  <input id="imageInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if(file) {
                       const reader = new FileReader();
                       reader.onloadend = () => { setImage(reader.result as string); setBase64Image((reader.result as string).split(',')[1]); };
                       reader.readAsDataURL(file);
                     }
                  }} />
                </div>

                <div className="bg-white rounded-[32px] border border-apple-border p-6 shadow-sm space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-apple-secondary-text">
                      <Tag size={14} />
                      <span className="text-xs font-bold uppercase tracking-wide">Product Match</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        className="bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-apple-blue/20"
                        value={selectedProductId}
                        onChange={(e) => { setSelectedProductId(e.target.value); setSelectedVariantIdx(0); }}
                      >
                        <option value="">Artifact</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <select 
                        className="bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none cursor-pointer disabled:opacity-30 focus:ring-2 focus:ring-apple-blue/20"
                        disabled={!selectedProductId}
                        value={selectedVariantIdx}
                        onChange={(e) => setSelectedVariantIdx(parseInt(e.target.value))}
                      >
                        {selectedProduct?.variants.map((v, i) => (
                          <option key={i} value={i}>{v.color}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4 text-apple-secondary-text">
                      <AlignLeft size={14} />
                      <span className="text-xs font-bold uppercase tracking-wide">Contextual Tone</span>
                    </div>
                    <textarea 
                      className="w-full bg-apple-secondary border-none rounded-2xl p-5 text-sm font-medium placeholder:opacity-50 resize-none h-28 outline-none leading-relaxed focus:ring-2 focus:ring-apple-blue/20"
                      placeholder="Add specific details about the conversation..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                    />
                  </div>
                </div>

                {image && (
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#005bb7' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => generateResponse()}
                    disabled={loading}
                    className="w-full bg-apple-blue text-white py-5 rounded-[24px] font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-apple-blue/20"
                  >
                    {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <Send size={20} />}
                    {loading ? "Generating..." : "Generate Response"}
                  </motion.button>
                )}
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[32px] p-8 border border-apple-border shadow-sm min-h-[220px] flex flex-col group">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold tracking-wide text-slate-400">VIETNAMESE</span>
                    {response.vi && (
                      <button onClick={() => copyResponse(response.vi, 'vi')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${copiedVi ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                        {copiedVi ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-2xl font-bold leading-snug tracking-tight text-slate-900">
                    {loading ? (
                      <div className="space-y-4 animate-pulse opacity-20">
                        <div className="h-6 bg-slate-900 rounded-full w-full"></div>
                        <div className="h-6 bg-slate-900 rounded-full w-2/3"></div>
                      </div>
                    ) : (
                      response.vi || <span className="text-slate-300 font-normal">Awaiting processing...</span>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-apple-border shadow-sm min-h-[220px] flex flex-col group">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold tracking-wide text-slate-400">ENGLISH</span>
                    {response.en && (
                      <button onClick={() => copyResponse(response.en, 'en')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${copiedEn ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                        {copiedEn ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-2xl font-bold leading-snug tracking-tight text-slate-800">
                     {loading ? (
                       <div className="space-y-4 animate-pulse opacity-20">
                         <div className="h-6 bg-slate-900 rounded-full w-full"></div>
                         <div className="h-6 bg-slate-900 rounded-full w-3/4"></div>
                       </div>
                     ) : (
                       response.en || <span className="text-slate-300 font-normal">The English alternative...</span>
                     )}
                  </div>
                </div>

                {response.en && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[24px] p-6 flex items-center justify-between border border-apple-border shadow-sm"
                  >
                    <div className="flex flex-col gap-1.5 px-2">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-apple-secondary-text">Accuracy</span>
                       <div className="flex items-center gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>
                             <Star size={22} fill={(hoverRating || rating) >= star ? "#FF9500" : "transparent"} color={(hoverRating || rating) >= star ? "#FF9500" : "#D2D2D7"} strokeWidth={1.5} />
                           </button>
                         ))}
                       </div>
                    </div>
                    <button onClick={() => generateResponse(true)} disabled={loading} className="px-8 py-3 bg-apple-secondary rounded-full text-xs font-bold flex items-center gap-2 hover:bg-apple-border/20 transition-all border border-apple-border">
                      <RotateCcw size={16} /> Regenerate
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-6xl mx-auto px-4"
            >
              <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
                <div className="space-y-2">
                  <h2 className="text-[56px] font-extrabold tracking-tight text-slate-900 leading-none">Inventory</h2>
                  <p className="text-slate-500 font-medium text-lg">Manage and curate your artifact collection.</p>
                </div>
                <button onClick={handleAddProduct} className="bg-apple-blue text-white px-10 py-4 rounded-2xl text-sm font-bold shadow-lg shadow-apple-blue/20 hover:opacity-90 transition-all flex items-center gap-2">
                  <Plus size={18} /> Add Artifact
                </button>
              </div>

              <div className="space-y-8">
                {filteredProducts.map(product => {
                  const currentVarIdx = productVariantMap[product.id] || 0;
                  const variant = product.variants[currentVarIdx];

                  return (
                    <motion.div 
                      layout
                      key={product.id} 
                      className="bg-white rounded-[24px] sm:rounded-[32px] border border-apple-border shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-row group"
                    >
                      <div className="w-[110px] sm:w-[240px] md:w-[320px] lg:w-[400px] aspect-square relative overflow-hidden bg-apple-secondary shrink-0">
                        <motion.img 
                          layoutId={`img-${product.id}`}
                          src={variant.image} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                      <div className="p-4 sm:p-8 flex-1 flex flex-col justify-between space-y-3 sm:space-y-6 overflow-hidden">
                        <div className="space-y-3 sm:space-y-6">
                          <div className="flex justify-between items-start gap-2 sm:gap-4">
                            <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                              <h3 className="text-sm sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">{product.name}</h3>
                              <p className="text-[8px] sm:text-xs font-bold text-apple-secondary-text uppercase tracking-widest">{variant.color}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm sm:text-2xl font-extrabold text-apple-blue tracking-tighter block">{product.price}đ</span>
                              {product.oldPrice !== product.price && <span className="text-[8px] sm:text-xs font-bold text-slate-400 line-through tracking-tight">{product.oldPrice}đ</span>}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {product.variants.map((v, i) => (
                              <button 
                                key={i}
                                onClick={() => setProductVariantMap({...productVariantMap, [product.id]: i})}
                                className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold tracking-wide transition-all ${currentVarIdx === i ? 'bg-slate-900 text-white' : 'bg-apple-secondary text-slate-600 hover:bg-apple-secondary/80'}`}
                              >
                                {v.color}
                              </button>
                            ))}
                          </div>

                          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6 py-4 sm:py-6 border-y border-slate-100">
                             <div className="space-y-1.5">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Layers size={13} /> Size</span>
                               <p className="text-sm font-bold text-slate-700">{product.size}</p>
                             </div>
                             <div className="space-y-1.5">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Layout size={13} /> Form</span>
                               <p className="text-sm font-bold text-slate-700">{product.form}</p>
                             </div>
                             <div className="hidden lg:block space-y-1.5">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><AlignLeft size={13} /> Material</span>
                               <p className="text-sm font-bold text-slate-700">Premium Cotton</p>
                             </div>
                          </div>

                          <div className="text-[10px] sm:text-sm font-medium text-slate-600 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                             {product.description}
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 sm:gap-6">
                          <div className="space-y-2 sm:space-y-3">
                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gallery (Copy High-Res)</span>
                            <div className="flex gap-1.5 sm:gap-2">
                              {(variant.subImages || [null, null, null, null]).slice(0, 4).map((img, i) => (
                                <div key={i} className="w-8 h-8 sm:w-16 sm:h-16 bg-apple-secondary rounded-lg sm:rounded-xl overflow-hidden border border-apple-border/40 cursor-pointer hover:border-apple-blue transition-colors group/sub" onClick={() => img && copyImage(img)}>
                                  {img ? <img src={img} className="w-full h-full object-cover group-hover/sub:scale-110 transition-transform" /> : <ImageIcon size={10} className="m-auto opacity-10" />}
                                </div>
                              ))}
                              <div className="w-8 h-8 sm:w-16 sm:h-16 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10" onClick={() => copyAllSubImages(variant.subImages)}>
                                <Download size={14} className="text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1.5 sm:gap-2 shrink-0">
                            <button onClick={() => copyProductInfo(product, currentVarIdx)} className="flex-1 sm:flex-none px-3 sm:px-8 py-2 sm:py-4 bg-apple-secondary hover:bg-apple-border/20 rounded-lg sm:rounded-2xl text-[8px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2">
                              <Clipboard size={12} /> Copy
                            </button>
                            <button onClick={() => handleEditClick(product, currentVarIdx)} className="p-2 sm:p-4 bg-white border border-apple-border rounded-lg sm:rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                              <Edit3 size={14} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-apple-border flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">Edit Artifact</h3>
                    <p className="text-xs text-apple-secondary-text font-medium mt-0.5">{editingProduct.name}</p>
                  </div>
                  <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-apple-secondary rounded-full transition-colors text-apple-secondary-text">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {editingProduct.variants.map((v, i) => (
                    <button 
                      key={i}
                      onClick={() => setEditingVariantIdx(i)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${editingVariantIdx === i ? 'bg-apple-text text-white border-apple-text' : 'bg-apple-secondary text-slate-600 border-transparent hover:bg-apple-secondary/80'}`}
                    >
                      {v.color}
                    </button>
                  ))}
                  <button 
                    onClick={addNewVariant}
                    className="aspect-square w-8 flex items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue border border-apple-blue/20 hover:bg-apple-blue hover:text-white transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-10 overflow-y-auto flex-1">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group w-40 h-40 flex-shrink-0 bg-apple-secondary rounded-[24px] overflow-hidden border border-apple-border">
                    <img src={editingProduct.variants[editingVariantIdx].image} alt="Edit" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer" onClick={() => document.getElementById('editProductImg')?.click()}>
                      <Camera size={20} /><span className="text-[10px] font-bold mt-2">New Image</span>
                    </div>
                    <input id="editProductImg" type="file" accept="image/*" className="hidden" onChange={handleProductImageChange} />
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <span className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider">Detail Gallery</span>
                    <div className="grid grid-cols-4 gap-3">
                      {editingProduct.variants[editingVariantIdx].subImages.map((img: string | null, i: number) => (
                        <div key={i} className="relative aspect-square rounded-[14px] overflow-hidden bg-apple-secondary border border-apple-border group/subedit cursor-pointer">
                          {img ? <img src={img} className="w-full h-full object-cover" /> : <Plus size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-apple-secondary-text/40" />}
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/subedit:opacity-100 transition-opacity flex items-center justify-center text-white"
                            onClick={() => document.getElementById(`subImgInput-${i}`)?.click()}
                          >
                            <Camera size={14} />
                          </div>
                          <input id={`subImgInput-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleSubImageChange(e, i)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Name</label>
                     <input className="w-full bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.name} onChange={(e) => updateEditingField('name', e.target.value)} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-blue uppercase tracking-wider ml-1">Color Variant</label>
                     <input className="w-full bg-apple-blue/5 border-none rounded-2xl p-4 text-sm font-semibold text-apple-blue outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.variants[editingVariantIdx].color} onChange={(e) => updateEditingVariantColor(e.target.value)} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Price</label>
                     <input className="w-full bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.price} onChange={(e) => updateEditingField('price', formatPrice(e.target.value))} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Old Price</label>
                     <input className="w-full bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.oldPrice} onChange={(e) => updateEditingField('oldPrice', formatPrice(e.target.value))} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Dimensions</label>
                     <input className="w-full bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.size} onChange={(e) => updateEditingField('size', e.target.value)} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Form</label>
                     <input className="w-full bg-apple-secondary border-none rounded-2xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all" value={editingProduct.form} onChange={(e) => updateEditingField('form', e.target.value)} />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-apple-secondary-text uppercase tracking-wider ml-1">Description</label>
                   <textarea className="w-full bg-apple-secondary border-none rounded-2xl p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all h-28 resize-none leading-relaxed" value={editingProduct.description} onChange={(e) => updateEditingField('description', e.target.value)} />
                </div>
              </div>

              <div className="p-8 border-t border-apple-border flex gap-4 bg-white/50 backdrop-blur-md">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 rounded-2xl text-xs font-bold bg-apple-secondary hover:bg-apple-border/20 transition-all">Cancel</button>
                <button onClick={handleSaveProduct} className="flex-[2] py-4 rounded-2xl text-xs font-bold bg-apple-text text-white shadow-xl hover:opacity-90 transition-all">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {copyToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 z-[110] border border-white/10 backdrop-blur-md"
          >
             {copyToast === 'processing' ? <RefreshCw className="animate-spin text-white/50" size={16} /> : (copyToast === 'error' ? <X className="text-red-400" size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-apple-blue shadow-[0_0_10px_#0066CC]"></div>)}
             <span className="text-xs font-bold tracking-tight">
               {copyToast === 'processing' ? 'Processing Synthesis...' : 
                copyToast === 'image' ? 'Reference Captured' : 
                copyToast === 'error' ? 'Transmission Failed' :
                copyToast === 'fallback' ? 'External Reference Opened' : 
                copyToast === 'saved' ? 'Archive Updated' : 
                copyToast === 'info' ? 'Statement Archived' :
                copyToast === 'no_images' ? 'No Visuals Found' :
                copyToast === 'all_images' ? 'Collage Synthesis Complete' :
                copyToast === 'copied' ? 'Dialect Copied' :
                'Success'}
             </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
