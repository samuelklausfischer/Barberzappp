import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, FileText, Save, Calendar } from 'lucide-react';
import { formatPhone } from '../../logic/clientLogic';

/**
 * ClientForm Component
 * 
 * Form for creating or editing clients with validation.
 * 
 * @param {Object} props
 * @param {Object} props.client - Client data (for editing)
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {boolean} props.loading - Loading state
 */
export const ClientForm = ({ 
  client = null, 
  isOpen, 
  onClose, 
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: ''
    },
    notes: '',
    status: 'pending'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form with client data when editing
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        birthdate: client.birthdate ? client.birthdate.split('T')[0] : '',
        address: client.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          cep: ''
        },
        notes: client.notes || '',
        status: client.status || 'pending'
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthdate: '',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          cep: ''
        },
        notes: '',
        status: 'pending'
      });
    }
    setErrors({});
    setTouched({});
  }, [client, isOpen]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Nome é obrigatório';
        } else if (value.trim().length < 3) {
          error = 'Nome deve ter pelo menos 3 caracteres';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'E-mail inválido';
        }
        break;
      case 'phone':
        const cleanedPhone = value.replace(/\D/g, '');
        if (!cleanedPhone || cleanedPhone.length < 11) {
          error = 'Telefone inválido';
        }
        break;
      case 'address.cep':
        if (value && !/^\d{5}-?\d{3}$/.test(value)) {
          error = 'CEP inválido (formato: 00000-000)';
        }
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));

      // Validate if field has been touched
      if (touched[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validateField(name, value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Validate if field has been touched
      if (touched[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validateField(name, value)
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');

    // Format as Brazilian phone
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `+55 ${value}`;
      } else if (value.length <= 7) {
        value = `+55 ${value.slice(0, 2)} ${value.slice(2)}`;
      } else {
        value = `+55 ${value.slice(0, 2)} ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }

    setFormData(prev => ({ ...prev, phone: value }));

    if (touched.phone) {
      setErrors(prev => ({
        ...prev,
        phone: validateField('phone', value)
      }));
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');

    // Format CEP
    if (value.length > 0) {
      if (value.length <= 5) {
        value = value;
      } else {
        value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
      }
    }

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        cep: value
      }
    }));

    if (touched['address.cep']) {
      setErrors(prev => ({
        ...prev,
        ['address.cep']: validateField('address.cep', value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    const newTouched = {};

    Object.keys(formData).forEach(key => {
      if (key !== 'address') {
        newTouched[key] = true;
        newErrors[key] = validateField(key, formData[key]);
      }
    });

    Object.keys(formData.address).forEach(key => {
      const fieldKey = `address.${key}`;
      newTouched[fieldKey] = true;
      newErrors[fieldKey] = validateField(fieldKey, formData.address[key]);
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');

    if (!hasErrors) {
      try {
        await onSave(formData);
      } catch (error) {
        // Handle error from parent component
        console.error('Error saving client:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 id="client-form-title" className="text-xl font-bold text-white">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {client ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-slate-700/50 border rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                        errors.name ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="João Silva"
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-slate-700/50 border rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                        errors.email ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="joao@email.com"
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                    Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={handleBlur}
                      className={`w-full bg-slate-700/50 border rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                        errors.phone ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="+55 11 98765-4321"
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Birthdate */}
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-400 mb-1">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                  >
                    <option value="pending">Pendente</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-400 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Av. Paulista"
                  />
                </div>

                <div>
                  <label htmlFor="address.number" className="block text-sm font-medium text-gray-400 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    id="address.number"
                    name="address.number"
                    value={formData.address.number}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label htmlFor="address.cep" className="block text-sm font-medium text-gray-400 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    id="address.cep"
                    name="address.cep"
                    value={formData.address.cep}
                    onChange={handleCepChange}
                    onBlur={handleBlur}
                    className={`w-full bg-slate-700/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                        errors['address.cep'] ? 'border-red-500' : 'border-slate-600'
                      }`}
                    placeholder="01310-100"
                  />
                  {errors['address.cep'] && touched['address.cep'] && (
                    <p className="text-red-400 text-xs mt-1">{errors['address.cep']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address.neighborhood" className="block text-sm font-medium text-gray-400 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    id="address.neighborhood"
                    name="address.neighborhood"
                    value={formData.address.neighborhood}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Bela Vista"
                  />
                </div>

                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-400 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-400 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="SP"
                    maxLength="2"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-400 mb-1">
                Notas e Observações
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                  placeholder="Comentários sobre o cliente, preferências, etc."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700/50 bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {client ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
