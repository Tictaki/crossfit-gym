'use client';

import { useState, useEffect, useDeferredValue, memo } from 'react';
import { productsAPI, UPLOAD_URL, getImageUrl } from '@/lib/api';
import { 
  ShoppingBagIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon,
  TicketIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentTextIcon,
  XMarkIcon,
  CameraIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';
import { formatCurrency, dateFormatter, timeFormatter } from '@/lib/utils';
import BarcodeScanner from '@/components/BarcodeScanner';
import { io } from 'socket.io-client';
import { QRCodeCanvas } from 'qrcode.react';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export default function ProductsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [localIp, setLocalIp] = useState('localhost');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [formData, setFormData] = useState({
    name: '',
    commercialName: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    packageSize: '',
    sku: ''
  });
  const [saleData, setSaleData] = useState({
    quantity: 1,
    paymentMethod: 'CASH'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    
    // Initialize Socket.io - Use absolute Railway URL in production
    const socketBackendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : UPLOAD_URL.replace(/\/api$/, '');
    
    const socketInstance = io(socketBackendUrl);
    const sid = user.id || Math.random().toString(36).substring(7);
    setSessionId(sid);

    socketInstance.on('connect', () => {
      socketInstance.emit('join-scanner-room', sid);
    });

    socketInstance.on('remote-barcode', (code) => {
      setFormData(prev => ({ ...prev, sku: code }));
      toast.success('Código recebido do telemóvel!');
      setIsPairingOpen(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const response = await productsAPI.list();
        setProducts(response.data);
      } else {
        const response = await productsAPI.listSales();
        setSales(response.data);
      }
      
      // Also fetch local IP for scanner
      try {
        const ipRes = await productsAPI.getLocalIP();
        setLocalIp(ipRes.data.ip);
      } catch (e) {
        console.error('Failed to get local IP:', e);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        commercialName: product.commercialName || '',
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category || '',
        packageSize: product.packageSize || '',
        sku: product.sku || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        commercialName: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        packageSize: '',
        sku: '',
        status: true
      });
    }
    setImagePreview(product?.photo ? `${UPLOAD_URL}${product.photo}` : null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (selectedFile) {
        data.append('photo', selectedFile);
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
      } else {
        await productsAPI.create(data);
      }
      setIsModalOpen(false);
      loadData();
      toast.success(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setFormData({ ...formData, sku: decodedText });
    setIsScannerOpen(false);
    toast.success('Código lido com sucesso!');
  };

  const handleDelete = async (id) => {
    if (await confirm({
      title: 'Eliminar Produto?',
      message: 'Tem a certeza que deseja eliminar este produto? Esta ação não pode ser desfeita.',
      confirmText: 'Eliminar',
      variant: 'danger'
    })) {
    try {
      await productsAPI.delete(id);
      loadData();
      toast.success('Produto eliminado com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao eliminar produto');
    }
  }
  };

  const handleOpenSaleModal = (product) => {
    setSelectedProduct(product);
    setSaleData({ quantity: 1, paymentMethod: 'CASH' });
    setIsSaleModalOpen(true);
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.recordSale({
        productId: selectedProduct.id,
        quantity: saleData.quantity,
        totalAmount: selectedProduct.price * saleData.quantity,
        paymentMethod: saleData.paymentMethod
      });
      setIsSaleModalOpen(false);
      loadData();
      toast.success('Venda registada com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registar venda');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
            <ShoppingBagIcon className="h-8 w-8 text-primary-500" />
            Gestão de Produtos
          </h1>
          <p className="text-gray-500 dark:text-dark-300 mt-1">Gira o inventário e vendas do ginásio</p>
        </div>
        
        {activeTab === 'inventory' && userRole === 'ADMIN' && (
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <PlusIcon className="h-5 w-5" />
            Novo Produto
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder={`Pesquisar ${activeTab === 'inventory' ? 'produtos' : 'vendas'}...`}
            className="input pl-11 bg-white/50 dark:bg-dark-800/50 text-sm h-11 rounded-2xl border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/20 dark:bg-dark-800/30 p-1 rounded-2xl w-full sm:w-fit border border-white/20 dark:border-dark-700/50 backdrop-blur-md overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
            activeTab === 'inventory' 
              ? 'bg-gradient-primary text-white shadow-lg' 
              : 'text-dark-600 dark:text-dark-200 hover:text-primary-500'
          }`}
        >
          <ArchiveBoxIcon className="h-4 w-4" />
          Inventário
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
            activeTab === 'sales' 
              ? 'bg-gradient-primary text-white shadow-lg' 
              : 'text-dark-600 dark:text-dark-200 hover:text-primary-500'
          }`}
        >
          <TicketIcon className="h-4 w-4" />
          Vendas
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {products
            .filter(p => p.name.toLowerCase().includes(deferredSearch.toLowerCase()))
            .map((product) => (
            <div key={product.id} className="card-glass group overflow-hidden border-none shadow-premium hover:shadow-glow-sm transition-all duration-500 hover:-translate-y-1 !p-3 sm:!p-6">
              <div className="relative">
                  <div className="aspect-square w-full bg-gray-100 dark:bg-dark-900 flex items-center justify-center overflow-hidden rounded-2xl mb-4 relative shadow-inner">
                    {product.photo ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src={getImageUrl(product.photo)} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="flex flex-col items-center gap-2"><svg class="h-12 w-12 text-dark-300 dark:text-dark-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBagIcon className="h-12 w-12 text-dark-300 dark:text-dark-700" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 p-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md rounded-xl shadow-sm border border-white/20">
                      <ShoppingBagIcon className="h-4 w-4 text-primary-500" />
                    </div>
                    
                    {userRole === 'ADMIN' && (
                      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }} className="p-3 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md rounded-2xl text-blue-500 shadow-lg border border-white/20 active:scale-90 transition-all">
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="p-3 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md rounded-2xl text-red-500 shadow-lg border border-white/20 active:scale-90 transition-all">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-dark-300 line-clamp-2 h-8 leading-relaxed">{product.description || 'Sem descrição detalhada'}</p>
                  </div>
                  
                  <div className="flex justify-between items-end bg-dark-50/50 dark:bg-dark-800/30 p-3 rounded-2xl border border-white/10">
                    <div>
                      <p className="text-[9px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-widest mb-0.5">Preço</p>
                      <p className="text-lg sm:text-xl font-black text-primary-600 dark:text-primary-400 leading-none">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-dark-400 dark:text-dark-400 uppercase tracking-widest mb-0.5">Stock</p>
                      <p className={`text-base sm:text-lg font-bold leading-none ${product.stock <= 5 ? 'text-red-500' : 'text-green-500'}`}>{product.stock}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button 
                      onClick={() => handleOpenSaleModal(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                        product.stock <= 0 
                          ? 'bg-gray-100 dark:bg-dark-800 text-dark-400 cursor-not-allowed' 
                          : 'bg-dark-950 dark:bg-white dark:text-dark-950 text-white hover:shadow-glow-sm'
                      }`}
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      {product.stock <= 0 ? 'Sem Stock' : 'Vender agora'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          
          {products.filter(p => p.name.toLowerCase().includes(deferredSearch.toLowerCase())).length === 0 && (
            <div className="col-span-full py-20 text-center card-glass">
              <ArchiveBoxIcon className="h-12 w-12 text-dark-200 dark:text-dark-800 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-dark-300 font-medium italic">Nenhum produto corresponde à sua pesquisa</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-glass p-0 overflow-hidden border-none shadow-premium">
          <div className="overflow-x-auto relative z-10">
            <div className="table-container p-0 sm:p-4">
            <table className="table min-w-full table-responsive-cards mt-0 border-none">
              <thead className="bg-dark-900 border-b border-white/10 hidden sm:table-header-group">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Qtd</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-dark-800/50">
                {sales
                  .filter(s => s.product?.name?.toLowerCase().includes(deferredSearch.toLowerCase()))
                  .map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors group">
                      <td className="px-6 py-5" data-label="Data">
                        <div className="flex flex-col sm:items-start items-end">
                          <span className="text-xs font-bold text-dark-900 dark:text-white">{dateFormatter.format(new Date(sale.saleDate))}</span>
                          <span className="text-[10px] text-dark-400 opacity-70 uppercase">{timeFormatter.format(new Date(sale.saleDate))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Produto">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden mr-3 shadow-sm border border-white/20 shrink-0">
                            {sale.product?.photo ? (
                              <img src={getImageUrl(sale.product.photo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBagIcon className="h-5 w-5 text-dark-300" />
                            ) }
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-dark-900 dark:text-white leading-tight truncate max-w-[120px] sm:max-w-none">{sale.product?.name}</p>
                            <p className="text-[9px] text-dark-400 font-bold uppercase tracking-widest mt-0.5">Por: {sale.seller?.name?.split(' ')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center" data-label="Quantidade">
                        <span className="text-xs font-bold text-dark-700 dark:text-dark-200">{sale.quantity} un.</span>
                      </td>
                      <td className="px-6 py-5 text-center" data-label="Total">
                        <span className="text-sm font-black text-primary-600 dark:text-primary-400">{formatCurrency(sale.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-5 text-right" data-label="Método">
                        <span className="px-2.5 py-1 bg-white/50 dark:bg-dark-800/50 border border-white/20 dark:border-dark-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-dark-600 dark:text-dark-300">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                
                {sales.filter(s => s.product?.name?.toLowerCase().includes(deferredSearch.toLowerCase())).length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-medium italic">
                      Nenhum registo de venda encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up md:animate-scale-in border border-white/20 dark:border-dark-700/50 max-h-[90dvh] md:max-h-[auto] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-dark-400 dark:text-dark-300 font-medium mt-1">
                  Preencha as informações do produto para o inventário.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-200 hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Section: Basic Info */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em] px-1">Identificação e Marca</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Upload */}
                  <div className="space-y-4">
                    <label className="label">Foto do Produto</label>
                    <div 
                      className="relative h-40 rounded-3xl border-2 border-dashed border-dark-200 dark:border-dark-700 hover:border-primary-500 transition-colors cursor-pointer group flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-dark-800/50"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CameraIcon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 rounded-2xl bg-white dark:bg-dark-800 shadow-sm border border-gray-100 dark:border-dark-700 mb-2 group-hover:scale-110 transition-transform">
                            <CameraIcon className="h-6 w-6 text-dark-400" />
                          </div>
                          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Clique para enviar</p>
                        </>
                      )}
                      <input 
                        id="photo-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label flex items-center gap-2">
                        <ShoppingBagIcon className="h-4 w-4 text-dark-400" />
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Whey Protein"
                        className="input-glass"
                      />
                    </div>
                    <div>
                      <label className="label flex items-center gap-2">
                        <PlusIcon className="h-4 w-4 text-dark-400" />
                        Nome Comercial / Marca
                      </label>
                      <input
                        type="text"
                        value={formData.commercialName}
                        onChange={(e) => setFormData({...formData, commercialName: e.target.value})}
                        placeholder="Ex: Gold Standard"
                        className="input-glass"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Description */}
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-dark-400" />
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes adicionais sobre o produto..."
                  className="input-glass min-h-[100px] resize-none py-3"
                />
              </div>

              {/* Section: Finance & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-dark-800/40 rounded-3xl border border-gray-100 dark:border-dark-700/50">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">Preços e Venda</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
                      <BanknotesIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00 MZN"
                      className="input-glass pl-12"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Controlo de Stock</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </div>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      placeholder="Quantidade inicial"
                      className="input-glass pl-12"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Logistics */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] px-1">Logística e Categoria</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Categoria</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Suplementos"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="label">Tamanho / Emb.</label>
                    <input
                      type="text"
                      value={formData.packageSize}
                      onChange={(e) => setFormData({...formData, packageSize: e.target.value})}
                      placeholder="900g, 500ml"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="label">Código (SKU)</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Opcional"
                        className="input-glass pr-12"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="p-3 rounded-xl bg-dark-100 dark:bg-dark-800 text-primary-500 hover:scale-110 transition-transform"
                          title="Usar Câmara do PC"
                        >
                          <CameraIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPairingOpen(true)}
                          className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-500 hover:scale-110 transition-transform"
                          title="Conectar Telemóvel"
                        >
                          <DevicePhoneMobileIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary flex-1 py-4"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary flex-1 py-4 shadow-glow disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                       <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       <span>A guardar...</span>
                    </div>
                  ) : (
                    editingProduct ? 'Guardar Alterações' : 'Criar Produto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-md animate-fade-in" onClick={() => setIsSaleModalOpen(false)} />
          <div className="relative w-full max-w-md card-glass p-8 animate-slide-up md:animate-scale-in bg-white/95 dark:bg-dark-900/95 rounded-t-[2.5rem] md:rounded-[2.5rem]">
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Registar Venda</h2>
            <p className="text-gray-500 dark:text-dark-300 mb-6 font-bold">{selectedProduct?.name}</p>
            
            <form onSubmit={handleRecordSale} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-[0.2em] mb-3 ml-1">Quantidade (Stock: {selectedProduct?.stock})</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setSaleData({...saleData, quantity: Math.max(1, saleData.quantity - 1)})}
                    className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-xl text-xl font-bold"
                  >-</button>
                  <input
                    type="number"
                    readOnly
                    value={saleData.quantity}
                    className="flex-1 h-12 bg-transparent text-center text-xl font-black focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setSaleData({...saleData, quantity: Math.min(selectedProduct?.stock || 1, saleData.quantity + 1)})}
                    className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-xl text-xl font-bold"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-[0.2em] mb-3 ml-1">Método de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CASH', 'MPESA', 'EMOLA', 'TRANSFER'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSaleData({...saleData, paymentMethod: method})}
                      className={`py-3 rounded-xl border text-[10px] font-bold tracking-widest transition-all ${
                        saleData.paymentMethod === method 
                          ? 'bg-dark-950 dark:bg-white text-white dark:text-dark-950 border-transparent shadow-lg' 
                          : 'border-white/20 dark:border-dark-700 text-dark-500'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm font-bold text-dark-600 dark:text-dark-200">Total a pagar:</span>
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                  {(selectedProduct?.price * saleData.quantity).toLocaleString()} MZN
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className="flex-1 py-4 px-4 border border-gray-200 dark:border-dark-700 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-4 px-4 bg-gradient-primary text-white rounded-2xl font-bold text-sm shadow-glow-sm hover:scale-[1.02] transition-transform uppercase tracking-widest">
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pairing Modal */}
      {isPairingOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-2xl p-8 text-center animate-scale-in border border-white/20 dark:border-dark-700/50">
            <button 
              onClick={() => setIsPairingOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="mb-6 inline-block p-4 rounded-3xl bg-primary-50 dark:bg-primary-900/20">
              <DevicePhoneMobileIcon className="h-12 w-12 text-primary-500" />
            </div>

            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Conectar Telemóvel</h3>
            <p className="text-sm text-dark-400 dark:text-dark-300 mb-8">
              Leia o QR Code abaixo com o seu telemóvel para o usar como leitor de código de barras.
            </p>

            <div className="bg-white p-6 rounded-3xl inline-block shadow-inner mb-8 border border-gray-100">
              <QRCodeCanvas 
                value={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                  ? `http://${localIp}:3000/dashboard/scanner?room=${sessionId}`
                  : `${window.location.origin}/dashboard/scanner?room=${sessionId}`
                }
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-500 uppercase tracking-widest animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Aguardando scan...
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}
