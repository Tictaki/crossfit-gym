'use client';

import { useState, useEffect } from 'react';
import { productsAPI, UPLOAD_URL } from '@/lib/api';
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
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmModalContext';
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
    
    // Initialize Socket.io
    const socketInstance = io(window.location.protocol + '//' + window.location.hostname + ':3001');
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

      {/* Tabs */}
      <div className="flex bg-white/20 dark:bg-dark-800/30 p-1.5 rounded-2xl w-fit border border-white/20 dark:border-dark-700/50 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
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
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card-glass group overflow-hidden border-none shadow-premium hover:shadow-glow-sm transition-all duration-500 hover:-translate-y-1">
              <div className="p-6">
                  <div className="h-40 w-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden rounded-2xl mb-4 relative">
                    {product.photo ? (
                      <img 
                        src={`${UPLOAD_URL}${product.photo}`} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <ShoppingBagIcon className="h-12 w-12 text-dark-300 dark:text-dark-700" />
                    )}
                    <div className="absolute top-2 left-2 p-2 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md rounded-xl shadow-sm">
                      <ShoppingBagIcon className="h-5 w-5 text-primary-500" />
                    </div>
                  </div>
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(product)} className="p-2 bg-white/50 dark:bg-dark-800/50 hover:bg-white dark:hover:bg-dark-800 rounded-xl text-blue-500 transition-colors">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/50 dark:bg-dark-800/50 hover:bg-white dark:hover:bg-dark-800 rounded-xl text-red-500 transition-colors">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-300 mb-4 line-clamp-2 h-10">{product.description || 'Sem descrição'}</p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest mb-1">Preço</p>
                      <p className="text-2xl font-black text-primary-600 dark:text-primary-400">{parseFloat(product.price).toLocaleString()} <span className="text-sm font-bold">MZN</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest mb-1">Stock</p>
                      <p className={`text-lg font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-green-500'}`}>{product.stock}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20 dark:border-dark-700/50">
                    <button 
                      onClick={() => handleOpenSaleModal(product)}
                      disabled={product.stock <= 0}
                      className="w-full py-3 bg-dark-950 dark:bg-white dark:text-dark-950 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                      Registar Venda
                    </button>
                  </div>
                </div>
              </div>
            ))}
          
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center card-glass">
              <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-dark-300 font-medium">Nenhum produto registado</p>
              <button 
                onClick={() => handleOpenModal()} 
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
              >
                Adicionar Primeiro Produto
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-glass p-0 overflow-hidden border-none shadow-premium">
          <div className="overflow-x-auto">
            <div className="table-container pt-4">
            <table className="table min-w-full table-responsive-cards">
              <thead className="bg-dark-900 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Preço</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Stock</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-dark-400 dark:text-dark-300 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-dark-800/50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/20 dark:hover:bg-dark-800/10 transition-colors group">
                    <td className="px-6 py-5" data-label="Produto">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden mr-3 shadow-sm border border-white/20">
                          {product.photo ? (
                            <img src={`${UPLOAD_URL}${product.photo}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary-500 font-black text-xs">{product.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-dark-900 dark:text-white leading-tight">{product.name}</p>
                          <p className="text-[10px] text-dark-400 font-bold uppercase tracking-widest">{product.sku || 'Sem SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-dark-600 dark:text-dark-300" data-label="Categoria">
                      {product.category || 'Geral'}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-dark-900 dark:text-white" data-label="Preço">
                      {parseFloat(product.price).toLocaleString()} MZN
                    </td>
                    <td className="px-6 py-5 text-center" data-label="Stock">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        product.stock <= 5 ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'
                      }`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2" data-label="Ações">
                      <button 
                        onClick={() => handleOpenSaleModal(product)}
                        disabled={product.stock <= 0}
                        className="btn-icon-sm bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
                        title="Registar Venda"
                      >
                        <BanknotesIcon className="h-4 w-4" />
                      </button>
                      {userRole === 'ADMIN' && (
                        <>
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="btn-icon-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white"
                            title="Editar Produto"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="btn-icon-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                            title="Eliminar Produto"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                
                {sales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 font-medium">
                      <TicketIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      Sem registos de vendas
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
                        className="input"
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
                        className="input"
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
                  className="input min-h-[100px] resize-none py-3"
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
                      className="input pl-12"
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
                      className="input pl-12"
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
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Tamanho / Emb.</label>
                    <input
                      type="text"
                      value={formData.packageSize}
                      onChange={(e) => setFormData({...formData, packageSize: e.target.value})}
                      placeholder="900g, 500ml"
                      className="input"
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
                        className="input pr-12"
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
                value={`http://${localIp}:3000/dashboard/scanner?room=${sessionId}`}
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
