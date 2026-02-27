import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { Search, UserPlus, X, Building2, Grid, List, CheckSquare, Trash2, Save, ChevronLeft, ChevronRight, Mail, Phone, Star, MapPin, MoreVertical, Edit2, User, Briefcase, Activity, CheckCircle, Ban, Users, ChevronDown, FileCheck2 } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (ids: string[]) => void;
  language?: 'fr' | 'en';
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier, language = 'fr' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Translations
  const t = TRANSLATIONS[language]?.suppliers || TRANSLATIONS.fr.suppliers;
  const commonT = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;

  // Form State for Add/Edit
  const defaultFormState: Partial<Supplier> = {
    name: '',
    nif: '',
    category: 'Matériel Informatique',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    rating: 3
  };
  const [formData, setFormData] = useState<Partial<Supplier>>(defaultFormState);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nif && s.nif.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const displayedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination when search or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // --- Handlers ---

  const handleOpenAdd = () => {
    setFormData(defaultFormState);
    setShowAddModal(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setEditingSupplier(null);
    setFormData(defaultFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingSupplier && onUpdateSupplier) {
      // Update Mode
      onUpdateSupplier({
        ...editingSupplier,
        ...formData as Supplier,
        rating: editingSupplier.rating, 
        status: editingSupplier.status,
        lastActiveDate: editingSupplier.lastActiveDate || new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
      });
    } else {
      // Add Mode
      onAddSupplier({
        id: Date.now().toString(),
        name: formData.name,
        nif: formData.nif,
        category: formData.category || 'Général',
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        rating: 3,
        status: 'active',
        lastActiveDate: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
      });
    }
    handleCloseModals();
  };

  const toggleSelection = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    }
  };

  const handleDeleteSelected = () => {
    if (onDeleteSupplier && selectedSuppliers.length > 0) {
      if (confirm(`${t.confirmDeleteMulti} ${selectedSuppliers.length} ${language === 'fr' ? 'fournisseur(s)' : 'supplier(s)'} ?`)) {
        onDeleteSupplier(selectedSuppliers);
        setSelectedSuppliers([]);
      }
    }
  };

  // --- Helpers ---

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  const getColor = (name: string) => {
    const colors = ['#0f62fe', '#393939', '#005d5d', '#da1e28', '#8a3ffc', '#0072c3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="max-w-[1600px] mx-auto h-full flex flex-col font-sans text-[var(--cds-text-01)]">
      
      {/* Header */}
      <div className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
        <div className="page-header-main">
           <p className="page-eyebrow">{language === 'fr' ? 'Fournisseurs' : 'Suppliers'}</p>
           <div className="flex items-center gap-4">
             <h1 className="page-title mt-0">{t.title}</h1>
             <span className="cds-tag cds-tag--gray font-mono">
                {suppliers.length} Total
             </span>
           </div>
           <p className="page-subtitle">{t.subtitle}</p>
        </div>
        
        <button 
           onClick={handleOpenAdd}
           className="cds-btn cds-btn--primary"
        >
           <UserPlus size={20} /> {t.addBtn}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)]">
        
        {/* Selection Actions Left */}
        {selectedSuppliers.length > 0 && (
           <div className="flex items-center gap-4 pr-4 border-r border-[var(--cds-border-subtle-01)]">
               <button 
                 onClick={handleDeleteSelected}
                 className="cds-btn cds-btn--danger h-10 text-sm"
               >
                 <Trash2 size={16} /> {t.deleteBtn} ({selectedSuppliers.length})
               </button>
           </div>
        )}

        <div className="relative flex-1 max-w-md group">
            <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cds-text-input pl-4 pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cds-text-01)]" size={16} />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-[var(--cds-layer-02)]">
                <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' : 'text-[var(--cds-text-01)] hover:bg-[var(--cds-border-subtle-01)]'}`}
                >
                   <Grid size={20} />
                </button>
                <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' : 'text-[var(--cds-text-01)] hover:bg-[var(--cds-border-subtle-01)]'}`}
                >
                   <List size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {filteredSuppliers.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-[var(--cds-text-02)] opacity-60 min-h-[300px]">
              <Building2 size={48} className="mb-4" />
              <p>{t.empty}</p>
           </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {displayedSuppliers.map((supplier) => {
                   const isSelected = selectedSuppliers.includes(supplier.id);
                   return (
                    <div 
                      key={supplier.id} 
                      onClick={() => handleOpenEdit(supplier)}
                      className={`group bg-[var(--cds-layer-01)] border p-4 transition-all cursor-pointer relative flex flex-col justify-between h-[240px] hover:border-[var(--cds-border-strong-01)] ${
                         isSelected ? 'border-[var(--cds-interactive-01)] ring-1 ring-[var(--cds-interactive-01)]' : 'border-[var(--cds-border-subtle-01)]'
                      }`}
                    >
                       <div className="absolute top-4 right-4 z-10" onClick={(e) => { e.stopPropagation(); toggleSelection(supplier.id); }}>
                          <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--cds-interactive-01)] border-[var(--cds-interactive-01)]' : 'border-[var(--cds-text-01)] bg-[var(--cds-layer-01)]'}`}>
                             {isSelected && <CheckSquare size={14} className="text-[var(--cds-inverse-01)]" />}
                          </div>
                       </div>

                       <div className="flex items-start gap-4">
                           <div 
                              className="w-12 h-12 flex items-center justify-center text-[var(--cds-inverse-01)] text-lg font-bold shrink-0"
                              style={{ backgroundColor: getColor(supplier.name) }}
                           >
                              {getInitials(supplier.name)}
                           </div>
                           <div className="pr-6">
                              <h3 className="font-semibold text-[var(--cds-text-01)] text-lg leading-tight line-clamp-2 mb-1" title={supplier.name}>{supplier.name}</h3>
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[var(--cds-layer-02)] text-[var(--cds-text-02)]">
                                 {supplier.category}
                              </span>
                           </div>
                       </div>

                       <div className="space-y-2 mt-auto">
                          {supplier.nif && (
                             <div className="flex items-center gap-2 text-sm text-[var(--cds-text-02)]">
                                 <FileCheck2 size={14} />
                                 <span className="font-mono text-xs">{supplier.nif}</span>
                             </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-[var(--cds-text-02)]">
                             <Mail size={14} />
                             <span className="truncate">{supplier.email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[var(--cds-text-02)]">
                             <Phone size={14} />
                             <span>{supplier.phone || '-'}</span>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--cds-border-subtle-01)]">
                          <div className="flex items-center gap-1">
                             <Star size={14} className="text-[var(--cds-support-warning)] fill-[var(--cds-support-warning)]" />
                             <span className="text-xs font-bold text-[var(--cds-text-01)]">{supplier.rating}</span>
                          </div>
                          <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${supplier.status === 'active' ? 'bg-[var(--cds-background-success-subtle)] text-[var(--cds-support-success)]' : 'bg-[var(--cds-layer-02)] text-[var(--cds-text-02)]'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'active' ? 'bg-[var(--cds-support-success)]' : 'bg-[var(--cds-text-02)]'}`}></div>
                             {supplier.status === 'active' ? t.status.active : t.status.inactive}
                          </div>
                       </div>
                    </div>
                   );
                })}
              </div>
            ) : (
              // LIST VIEW - Carbon Data Table
               <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--cds-layer-02)]">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <div 
                          onClick={toggleSelectAll} 
                          className={`w-4 h-4 border cursor-pointer transition-colors flex items-center justify-center ${selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0 ? 'bg-[var(--cds-interactive-01)] border-[var(--cds-interactive-01)]' : 'border-[var(--cds-text-01)] bg-[var(--cds-layer-01)]'}`}
                        >
                          {selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0 && <CheckSquare size={12} className="text-[var(--cds-inverse-01)]" />}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider">{language === 'fr' ? 'Fournisseur' : 'Supplier'}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider hidden md:table-cell">Contact</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider text-center">Performance</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cds-border-subtle-01)]">
                    {displayedSuppliers.map((supplier) => {
                       const isSelected = selectedSuppliers.includes(supplier.id);
                       return (
                         <tr 
                            key={supplier.id}
                            onClick={() => handleOpenEdit(supplier)}
                            className={`hover:bg-[var(--cds-border-subtle-01)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--cds-background-info-subtle)]' : 'bg-[var(--cds-layer-01)]'}`}
                         >
                            <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelection(supplier.id); }}>
                                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--cds-interactive-01)] border-[var(--cds-interactive-01)]' : 'border-[var(--cds-text-01)] bg-[var(--cds-layer-01)]'}`}>
                                   {isSelected && <CheckSquare size={12} className="text-[var(--cds-inverse-01)]" />}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="flex items-center gap-3">
                                   <div 
                                      className="w-8 h-8 flex items-center justify-center text-[var(--cds-inverse-01)] text-xs font-bold"
                                      style={{ backgroundColor: getColor(supplier.name) }}
                                   >
                                      {getInitials(supplier.name)}
                                   </div>
                                   <div>
                                      <div className="font-bold text-sm text-[var(--cds-text-01)]">{supplier.name}</div>
                                      <div className="text-xs text-[var(--cds-text-02)]">{supplier.category}</div>
                                      {supplier.nif && <div className="text-[10px] font-mono text-[var(--cds-text-02)] mt-0.5">NIF: {supplier.nif}</div>}
                                   </div>
                               </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                               <div className="text-sm text-[var(--cds-text-02)]">
                                  {supplier.email && <div className="flex items-center gap-2"><Mail size={12} /> {supplier.email}</div>}
                                  {supplier.phone && <div className="flex items-center gap-2 mt-1"><Phone size={12} /> {supplier.phone}</div>}
                               </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                               <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1 text-sm font-bold text-[var(--cds-text-01)]">
                                     <Star size={12} className="text-[var(--cds-support-warning)] fill-[var(--cds-support-warning)]" /> {supplier.rating}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase ${supplier.status === 'active' ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-text-02)]'}`}>
                                     {supplier.status === 'active' ? t.status.active : t.status.inactive}
                                  </span>
                               </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                               <button className="text-[var(--cds-interactive-01)] hover:text-[var(--cds-interactive-01-hover)]">
                                  <Edit2 size={16} />
                               </button>
                            </td>
                         </tr>
                       );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* PAGINATION CONTROLS */}
            {filteredSuppliers.length > 0 && (
               <div className="flex flex-col sm:flex-row items-center justify-between p-4 mt-auto border-t border-[var(--cds-border-subtle-01)] bg-[var(--cds-layer-01)]">
                  
                  <div className="flex items-center gap-3 text-sm text-[var(--cds-text-02)]">
                     <span className="hidden sm:inline">{language === 'fr' ? 'Lignes par page' : 'Rows per page'}</span>
                     <div className="relative">
                        <select 
                           value={itemsPerPage}
                           onChange={(e) => setItemsPerPage(Number(e.target.value))}
                           className="cds-select h-8 pl-3 pr-8 py-0 font-medium cursor-pointer"
                        >
                           <option value={8}>8</option>
                           <option value={16}>16</option>
                           <option value={24}>24</option>
                           <option value={48}>48</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--cds-text-01)]" />
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <span className="text-xs text-[var(--cds-text-02)]">
                        {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} {language === 'fr' ? 'sur' : 'of'} {filteredSuppliers.length}
                     </span>
                     
                     <div className="flex items-center gap-px bg-[var(--cds-layer-02)]">
                        <button 
                           onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                           disabled={currentPage === 1}
                           className="p-2 hover:bg-[var(--cds-border-subtle-01)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[var(--cds-text-01)]"
                        >
                           <ChevronLeft size={16} />
                        </button>
                        
                        <button 
                           onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages}
                           className="p-2 hover:bg-[var(--cds-border-subtle-01)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[var(--cds-text-01)]"
                        >
                           <ChevronRight size={16} />
                        </button>
                     </div>
                  </div>
               </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Shared Modal for Add and Edit */}
      {(showAddModal || editingSupplier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cds-overlay)] p-4">
           <div className="bg-[var(--cds-layer-01)] w-full max-w-md animate-zoom-in border border-[var(--cds-border-subtle-01)]">
              <div className="px-6 py-4 bg-[var(--cds-layer-02)] flex justify-between items-center">
                 <h3 className="text-lg font-medium text-[var(--cds-text-01)]">
                    {editingSupplier ? t.modalEdit : t.modalAdd}
                 </h3>
                 <button onClick={handleCloseModals} className="cds-icon-btn text-[var(--cds-text-02)] hover:text-[var(--cds-support-error)]">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div>
                    <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.name}</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="cds-text-input"
                      placeholder="Ex: Tech Solutions SARL"
                    />
                 </div>

                 {/* NIF Field */}
                 <div>
                    <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.nif}</label>
                    <input 
                      type="text" 
                      value={formData.nif} 
                      onChange={e => setFormData({...formData, nif: e.target.value})}
                      className="cds-text-input font-mono"
                      placeholder="Ex: 1000567890"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.category}</label>
                     <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="cds-select text-sm"
                     >
                        <option>Matériel Informatique</option>
                        <option>Logiciels & Licences</option>
                        <option>Services & Prestations</option>
                        <option>Mobilier de Bureau</option>
                        <option>Fournitures Générales</option>
                        <option>Autre</option>
                     </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.email}</label>
                        <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="cds-text-input"
                        placeholder="contact@..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.phone}</label>
                        <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="cds-text-input"
                        placeholder="+225..."
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-[var(--cds-text-02)] mb-2">{t.fields.address}</label>
                    <input 
                      type="text" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="cds-text-input"
                      placeholder="Ville, Quartier..."
                    />
                 </div>

                 <div className="pt-4 flex justify-between gap-3 items-center">
                    {editingSupplier ? (
                        <button 
                          type="button" 
                          onClick={() => {
                              if (confirm(t.confirmDelete)) {
                                  onDeleteSupplier && onDeleteSupplier([editingSupplier.id]);
                                  handleCloseModals();
                              }
                          }}
                          className="cds-btn cds-btn--danger h-10 flex items-center justify-center"
                          title={t.deleteBtn}
                        >
                          <Trash2 size={18} />
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <div className="flex gap-3">
                        <button 
                          type="button" 
                          onClick={handleCloseModals}
                          className="cds-btn cds-btn--secondary h-10"
                        >
                          {commonT.cancel}
                        </button>
                        <button 
                          type="submit" 
                          className="cds-btn cds-btn--primary h-10"
                        >
                          {commonT.save}
                        </button>
                    </div>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;


