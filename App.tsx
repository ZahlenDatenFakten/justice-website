import React, { useState, useEffect, useRef } from 'react';
import { User, OGPDocument, DocumentType, Fine, CaseFile, Notification, PromotionRequest, GlobalSettings } from './types';
import { DEFAULT_TEXTS, IMAGES, RESOLUTION_TEMPLATES, DEFAULT_CASE_FILE } from './constants';
import DocumentPreview from './components/DocumentPreview';
import CaseFilePreview from './components/CaseFilePreview';
import Profile from './components/Profile';
import Library from './components/Library';
import Staff from './components/Staff';
import Fines from './components/Fines';
import RichTextEditor from './components/RichTextEditor';
import { LogOut, FilePlus, User as UserIcon, BookOpen, Download, Save, Copy, AlertCircle, CheckCircle2, Users, Banknote, Briefcase, Plus, FolderOpen, ArrowLeft, Edit, Bell, Printer, Info, Loader2, Moon, Sun } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- CONSTANTS ---
const CREATOR_LOGIN = 'Tamerlanonelovejustice';
const API_URL = 'api/index.php';

// --- TOAST COMPONENT ---
interface ToastMsg {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

// --- AUTH COMPONENT ---
const AuthScreen: React.FC<{ onLogin: (user: User) => void, users: User[] }> = ({ onLogin, users }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [signature, setSignature] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setSignature(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.fullName || !formData.email || !formData.password || !signature) {
      setError('Ошибка: Все поля должны быть заполнены, включая подпись.');
      setLoading(false);
      return;
    }
    
    // Check local duplicate
    if (users.find(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
         setError('Ошибка: Пользователь с таким Email уже существует.');
         setLoading(false);
         return;
    }

    const newUser: User = {
      ...formData,
      position: 'Prosecutor', 
      signature: signature,
      createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch(`${API_URL}?route=users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to register');
        }
        
        setSuccess('Регистрация успешна! Вы можете войти.');
        setIsRegister(false);
        setFormData(prev => ({ ...prev, password: '' })); 
        setSignature('');
        // Reload to ensure list is updated
        window.location.reload(); 
    } catch (e: any) {
        setError(e.message || 'Ошибка сервера при регистрации.');
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    if (!formData.email || !formData.password) {
      setError('Ошибка: Введите Email и пароль.');
      return;
    }
    
    const user = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    
    if (!user) {
      setError('Ошибка: Пользователь не найден.');
      return;
    }
    if (user.password !== formData.password) {
      setError('Ошибка: Неверный пароль.');
      return;
    }
    
    // Update IP on backend
    await fetch(`${API_URL}?route=users/login_track`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: user.email })
    });

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-800 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-4 text-white">⚖️</div>
          <h1 className="text-2xl font-bold text-slate-800">DOJ San Andreas</h1>
          <p className="text-slate-500 text-sm">Official Documentation System</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${!isRegister ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}>Вход</button>
          <button className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${isRegister ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}>Регистрация</button>
        </div>
        {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6 rounded-r text-sm text-red-700 flex items-start gap-2 animate-pulse"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{error}</div>}
        {success && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-6 rounded-r text-sm text-green-700 flex items-start gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{success}</div>}
        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Имя Фамилия</label>
              <input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Пример: John Doe" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <p className="text-[10px] text-slate-400 mt-1">Должность по умолчанию: Prosecutor</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email / Логин</label>
            <input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Введите логин..." value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Пароль</label>
            <input type="password" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {isRegister && (
             <div>
               <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Подпись (PNG, без фона)</label>
               <input type="file" accept="image/png" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" onChange={handleSignature} />
               {!signature && isRegister && <p className="text-[10px] text-red-500 mt-1">* Загрузка подписи обязательна</p>}
             </div>
          )}
          <button onClick={isRegister ? handleRegister : handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 mt-6 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center">
             {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Создать аккаунт' : 'Войти в систему')}
          </button>
        </div>
      </div>
      <div className="absolute bottom-4 text-slate-500 text-xs text-center w-full">San Andreas Department of Justice &copy; 2026</div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ogp_current_session_user');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      const saved = localStorage.getItem('ogp_theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
      localStorage.setItem('ogp_theme', theme);
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'fines' | 'cases' | 'profile' | 'staff'>('create');
  
  // Data States
  const [usersList, setUsersList] = useState<User[]>([]);
  const [documents, setDocuments] = useState<OGPDocument[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ nextDJG: 1, nextDJP: 1 });
  const [bannedIps, setBannedIps] = useState<{ip: string, bannedAt: string}[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Forms
  const [caseViewMode, setCaseViewMode] = useState<'list' | 'edit' | 'view'>('list');
  const [caseData, setCaseData] = useState<Partial<CaseFile>>(DEFAULT_CASE_FILE);
  const [docType, setDocType] = useState<DocumentType>('resolution');
  const [subTemplate, setSubTemplate] = useState<string>('case_opening');
  
  const [fineDefendant, setFineDefendant] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [fineArticle, setFineArticle] = useState('');
  const [fineDuration, setFineDuration] = useState('48'); 

  const [docData, setDocData] = useState<Partial<OGPDocument>>({
    date: new Date().toISOString().split('T')[0],
    ...DEFAULT_TEXTS,
    number: '' 
  });
  
  const previewRef = useRef<HTMLDivElement>(null);
  const casePreviewRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  };

  // --- INITIAL DATA LOAD (FROM SERVER) ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}?route=init`);
            
            if (res.status === 403) {
                // You are banned
                throw new Error("ACCESS DENIED. YOUR IP IS BANNED.");
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error("Ошибка сервера. База данных недоступна.");
            }

            if(!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to load data");
            }
            
            const data = await res.json();
            
            setUsersList(data.users || []);
            setDocuments(data.documents || []);
            setFines(data.fines || []);
            setCaseFiles(data.cases || []);
            setPromotionRequests(data.promotions || []);
            setSettings(data.settings || { nextDJG: 1, nextDJP: 1 });
            setBannedIps(data.banned_ips || []);

            // AUTO-UPDATE CURRENT SESSION IF CHANGED IN DB
            if (user) {
                const freshUser = (data.users || []).find((u: User) => u.email === user.email);
                if (freshUser) {
                    // Update session if position/name changed
                    if (freshUser.position !== user.position || freshUser.fullName !== user.fullName) {
                        setUser(freshUser);
                        localStorage.setItem('ogp_current_session_user', JSON.stringify(freshUser));
                        showToast("Ваш профиль был обновлен с сервера", "info");
                    }
                }
            }
            
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Ошибка подключения к серверу", 'error');
            // If banned, kill the UI
            if (e.message && e.message.includes("BANNED")) {
                document.body.innerHTML = `<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:black;color:red;font-weight:bold;font-size:24px;">${e.message}</div>`;
            }
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [user?.email]); // Re-run if user email context changes, but primarily on mount

  // --- PERSIST SESSION ---
  useEffect(() => {
    if (user) localStorage.setItem('ogp_current_session_user', JSON.stringify(user));
    else localStorage.removeItem('ogp_current_session_user');
  }, [user]);

  // --- LOGIC ---
  const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length < 2) return name.substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getDayMonth = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${day}${month}`;
  };

  // Auto-set doc number
  useEffect(() => {
     if(!user) return;
     const prefix = user.position === 'Prosecutor' ? 'DJP' : 'DJG';
     const nextNum = prefix === 'DJP' ? settings.nextDJP : settings.nextDJG;
     
     if(!docData.number || !docData.number.startsWith(prefix) || docData.number === `${prefix}-№${String(nextNum - 1).padStart(3, '0')}`) {
        setDocData(prev => ({ ...prev, number: `${prefix}-№${String(nextNum).padStart(3, '0')}`}));
     }
  }, [settings, user, docData.number]);

  const handleDocChange = (field: keyof OGPDocument, value: string) => {
    setDocData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCaseChange = (field: keyof CaseFile, value: string) => {
    setCaseData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateKey: string) => {
    setSubTemplate(templateKey);
    setFineDefendant('');
    setFineAmount('');
    setFineArticle('');
    setFineDuration('48');
    const template = RESOLUTION_TEMPLATES[templateKey as keyof typeof RESOLUTION_TEMPLATES];
    if (template) {
      setDocData(prev => ({
        ...prev,
        subject: template.subject,
        basis: template.basis,
        points: template.points,
        deadline: template.deadline,
        responsibility: template.responsibility,
        effective: template.effective,
        warning: template.warning
      }));
    }
  };

  const updateSettings = async (newSettings: GlobalSettings) => {
      setSettings(newSettings);
      await fetch(`${API_URL}?route=settings`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(newSettings)
      });
  };

  const handlePublish = async () => {
    if (!user) return;
    const clean = (text: string) => (text || '').replace(/{{/g, '').replace(/}}/g, '');

    const newDoc: OGPDocument = {
      id: Date.now().toString(),
      type: docType,
      number: clean(docData.number || ''),
      date: docData.date || new Date().toISOString(),
      subject: clean(docData.subject || ''),
      basis: clean(docData.basis || ''),
      points: clean(docData.points || ''),
      deadline: clean(docData.deadline || ''),
      responsibility: clean(docData.responsibility || ''),
      effective: clean(docData.effective || ''),
      warning: clean(docData.warning || ''),
      author: user.fullName,
      authorPosition: user.position,
      authorEmail: user.email,
      authorSignature: user.signature,
      status: 'published',
      createdAt: new Date().toISOString()
    };
    
    // Save Doc
    try {
        await fetch(`${API_URL}?route=documents/add`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newDoc)
        });
        setDocuments(prev => [...prev, newDoc]);
        
        // Update Counter
        let newSettings = { ...settings };
        if (newDoc.number.startsWith('DJP')) newSettings.nextDJP++;
        else if (newDoc.number.startsWith('DJG')) newSettings.nextDJG++;
        await updateSettings(newSettings);

        if (subTemplate === 'article_5_2' || subTemplate === 'admin_responsibility') {
            const hours = parseInt(fineDuration) || 48;
            const deadlineDate = new Date();
            deadlineDate.setHours(deadlineDate.getHours() + hours);

            const newFine: Fine = {
                id: Date.now().toString(),
                documentNumber: newDoc.number,
                defendant: fineDefendant,
                amount: fineAmount,
                article: fineArticle,
                deadline: deadlineDate.toISOString(),
                status: 'pending',
                author: user.fullName,
                createdAt: new Date().toISOString(),
                comments: []
            };
            
            await fetch(`${API_URL}?route=fines/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newFine)
            });
            setFines(prev => [...prev, newFine]);
            showToast('Штраф добавлен в реестр', 'success');
        }

        showToast('Документ опубликован и сохранен на сервере', 'success');
        setDocData(prev => ({ ...prev, number: '' }));
        setFineDefendant('');
        setFineAmount('');
        setFineArticle('');
        setFineDuration('48');

    } catch (e) {
        showToast('Ошибка сохранения на сервере', 'error');
    }
  };

  // Update Fine logic
  const handleUpdateFine = async (updatedFine: Fine) => {
      setFines(prev => prev.map(f => f.id === updatedFine.id ? updatedFine : f));
      await fetch(`${API_URL}?route=fines/update`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updatedFine)
      });
  };

  const handleCreateCaseFromFine = (fine: Fine) => {
    if (!user) return;
    const dateObj = new Date(fine.createdAt);
    const dateStr = dateObj.toLocaleDateString();
    const initials = getInitials(fine.defendant);
    const dateCode = getDayMonth();
    const caseNumber = `DJ-${initials}-${dateCode}`;

    const conclusionTemplate = `
На основании вышеизложенного, Офис Генерального Прокурора приходит к следующему заключению:
Гражданин ${fine.defendant} проигнорировал законные требования Офиса Генерального Прокурора, выраженные в Постановлении ${fine.documentNumber} от ${dateStr}, и не произвел уплату штрафа в установленный срок.
В действиях гражданина усматриваются признаки состава преступления, предусмотренного статьей 16.12 Уголовно-Административного Кодекса.
    `;
    const protocolTemplate = `
${dateStr} было опубликовано постановление ${fine.documentNumber} в отношении гражданина ${fine.defendant} с наложением штрафной санкции в размере ${fine.amount} по статье ${fine.article}.
Гражданину было выделено 48 часов на уплату штрафа.
По истечении установленного срока, транзакция об уплате штрафа в казну штата не поступила.
    `;

    setCaseData({
        ...DEFAULT_CASE_FILE,
        reason: `Дело по ст. 16.12 УАК в отношении ${fine.defendant} (Неуплата штрафа ст. ${fine.article})`,
        plaintiff: 'Государство Сан-Андреас\nПредставитель: Офис Генерального Прокурора',
        defendant: fine.defendant,
        protocol: protocolTemplate.trim(),
        conclusion: conclusionTemplate.trim(),
        dateOpened: new Date().toLocaleDateString(),
        number: caseNumber,
        description: `В ходе надзорной деятельности по контролю исполнения постановлений Офиса Генерального Прокурора было выявлено нарушение сроков уплаты штрафа, назначенного постановлением ${fine.documentNumber}.`,
        measures: '1. Проверка реестра оплаты штрафов.\n2. Фиксация отсутствия платежа по истечении 48 часов.',
        materials: `1. Постановление ${fine.documentNumber} - [ссылка на портал]\n2. Выписка из реестра штрафов - [ссылка]`,
        decision: `1. Признать гражданина ${fine.defendant} виновным в совершении преступления, предусмотренного ст. 16.12 УАК.\n2. Передать материалы уголовного дела в Окружной суд штата Сан-Андреас.`
    });
    
    setActiveTab('cases');
    setCaseViewMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveCase = async () => {
      if(!user) return;
      if(!caseData.number) {
          showToast("Введите номер дела!", 'error');
          return;
      }
      
      const newCase: CaseFile = {
          id: caseData.id || Date.now().toString(),
          number: caseData.number,
          status: caseData.status || 'OPEN',
          accessLevel: caseData.accessLevel || 'OPEN',
          reason: caseData.reason || '',
          dateOpened: caseData.dateOpened || new Date().toLocaleDateString(),
          dateClosed: caseData.dateClosed || '',
          author: user.fullName,
          authorPosition: user.position,
          authorSignature: user.signature,
          plaintiff: caseData.plaintiff || '',
          defendant: caseData.defendant || '',
          protocol: caseData.protocol || '',
          description: caseData.description || '',
          measures: caseData.measures || '',
          materials: caseData.materials || '',
          conclusion: caseData.conclusion || '',
          decision: caseData.decision || '',
          createdAt: caseData.createdAt || new Date().toISOString()
      };
      
      // Optimistic update
      if (caseData.id) {
          setCaseFiles(prev => prev.map(c => c.id === caseData.id ? newCase : c));
      } else {
          setCaseFiles(prev => [...prev, newCase]);
      }

      await fetch(`${API_URL}?route=cases/save`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(newCase)
      });
      
      showToast('Дело сохранено на сервере!', 'success');
      setCaseViewMode('list');
      setCaseData(DEFAULT_CASE_FILE);
  };

  const handleDownloadPDF = async () => {
      // 1. Identify valid refs
      let element: HTMLElement | null = null;
      let filename = 'document.pdf';

      if (activeTab === 'cases' && caseData.number && casePreviewRef.current) {
          element = casePreviewRef.current;
          filename = `${caseData.number}.pdf`;
      } else if (activeTab === 'create' && docData.number && previewRef.current) {
          element = previewRef.current;
          filename = `${docData.number}.pdf`;
      }

      if (!element) {
          showToast("Ошибка: нет документа для скачивания", "error");
          return;
      }
      
      showToast("1/4 Подготовка документа...", "info");

      // 2. Clone and Prepare Container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.zIndex = '-1000';
      container.style.width = '794px'; // A4 width in px
      container.style.background = 'white';
      
      document.body.appendChild(container);

      // Clone the content
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Reset styles
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      clone.style.minHeight = 'auto';
      clone.classList.remove('shadow-2xl', 'mx-auto'); 
      
      container.appendChild(clone);

      try {
          // 3. Pre-process images: Convert all images to Base64 to avoid CORS/Network hangs during PDF gen
          showToast("2/4 Обработка изображений...", "info");
          
          const images = Array.from(clone.querySelectorAll('img'));
          const imagePromises = images.map(async (img) => {
              try {
                  // Create a temporary image to load the source
                  const tempImg = new Image();
                  tempImg.crossOrigin = "Anonymous"; // Try CORS
                  tempImg.src = img.src;
                  
                  await new Promise((resolve, reject) => {
                      tempImg.onload = resolve;
                      tempImg.onerror = reject;
                      // Timeout after 3s to prevent hanging
                      setTimeout(() => resolve(null), 3000); 
                  });

                  // Draw to canvas to get Base64
                  const canvas = document.createElement('canvas');
                  canvas.width = tempImg.naturalWidth;
                  canvas.height = tempImg.naturalHeight;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(tempImg, 0, 0);
                      img.src = canvas.toDataURL('image/png');
                  }
              } catch (e) {
                  console.warn("Image processing failed, keeping original src:", img.src);
                  // Keep original src if conversion fails
              }
          });

          await Promise.all(imagePromises);
          
          showToast("3/4 Генерация PDF...", "info");
          
          // Wait a tick for DOM update
          await new Promise(resolve => setTimeout(resolve, 100));

          const doc = new jsPDF({
              orientation: 'p',
              unit: 'pt',
              format: 'a4',
              compress: true
          });

          await doc.html(container, {
              callback: function(pdf) {
                  try {
                      showToast("4/4 Сохранение файла...", "info");
                      const blob = pdf.output('blob');
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      
                      setTimeout(() => {
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          if (document.body.contains(container)) {
                              document.body.removeChild(container);
                          }
                      }, 1000);
                      
                      showToast("Скачивание завершено!", "success");
                  } catch (err) {
                      console.error("Save error:", err);
                      showToast("Ошибка сохранения файла", "error");
                  }
              },
              x: 0,
              y: 0,
              html2canvas: {
                  scale: 0.75, 
                  useCORS: true, 
                  logging: false,
                  allowTaint: true,
                  letterRendering: true,
                  // Reduce image timeout to fail faster on bad images
                  imageTimeout: 5000, 
              },
              margin: [0, 0, 0, 0],
              autoPaging: 'text',
              width: 595.28,
              windowWidth: 794
          });

      } catch (e) {
          console.error("PDF Generation Error:", e);
          showToast("Ошибка при создании PDF", "error");
          if (document.body.contains(container)) {
              document.body.removeChild(container);
          }
      }
  };

  const handleDownloadWord = async () => {
      if (activeTab !== 'cases' || !caseData.number || !casePreviewRef.current) {
          showToast("Ошибка: нет дела для экспорта", "error");
          return;
      }

      showToast("Подготовка документа для Google Docs...", "info");

      // 1. Clone the element
      const element = casePreviewRef.current;
      const clone = element.cloneNode(true) as HTMLElement;

      // 2. Process Images (Convert to Base64)
      const images = Array.from(clone.querySelectorAll('img'));
      const imagePromises = images.map(async (img) => {
          try {
              const tempImg = new Image();
              tempImg.crossOrigin = "Anonymous";
              tempImg.src = img.src;
              await new Promise((resolve, reject) => {
                  tempImg.onload = resolve;
                  tempImg.onerror = reject;
                  setTimeout(() => resolve(null), 3000);
              });
              const canvas = document.createElement('canvas');
              canvas.width = tempImg.naturalWidth;
              canvas.height = tempImg.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(tempImg, 0, 0);
                  img.src = canvas.toDataURL('image/png');
              }
          } catch (e) {
              console.warn("Image processing failed:", e);
          }
      });

      await Promise.all(imagePromises);

      // 3. Prepare HTML for Word/Google Docs
      // We use a specific XML namespace to ensure Word/Docs treats it correctly.
      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title><style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; }
          .doc-page { width: 100%; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid black; padding: 5px; }
          img { max-width: 100%; height: auto; }
      </style></head><body>`;
      const postHtml = "</body></html>";
      
      // Extract inner HTML
      const html = preHtml + clone.innerHTML + postHtml;

      // 4. Create Blob and Download
      const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${caseData.number}.doc`; // .doc is better for HTML import than .docx
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }, 100);

      showToast("Файл скачан! Загрузите его в Google Docs.", "success");
  };

  const handleCopyImage = async (ref: React.RefObject<HTMLDivElement>) => {
     if (ref.current) {
      try {
        const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
        try {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (blob) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('Скопировано в буфер обмена!', 'success');
            } else { throw new Error("Blob failed"); }
        } catch (clipboardError) {
            const link = document.createElement('a');
            link.download = 'document.png';
            link.href = canvas.toDataURL();
            link.click();
            showToast('Буфер недоступен. Изображение скачано.', 'info');
        }
      } catch (e) { showToast('Ошибка обработки изображения', 'error'); }
     }
  };

  const handleRequestPromotion = async (requestedPosition: string) => {
      if (!user) return;
      const newRequest: PromotionRequest = {
          id: Date.now().toString(),
          userEmail: user.email,
          userName: user.fullName,
          currentPosition: user.position,
          requestedPosition: requestedPosition,
          date: new Date().toISOString()
      };
      setPromotionRequests(prev => [...prev, newRequest]);
      await fetch(`${API_URL}?route=promotions/add`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(newRequest)
      });
      showToast('Запрос на повышение отправлен', 'success');
  };

  const handleUpdateUser = async (updatedUser: User) => {
      // 1. Update List
      setUsersList(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
      
      // 2. Update Current Session if it's me
      if (user && user.email === updatedUser.email) {
          setUser(updatedUser);
          localStorage.setItem('ogp_current_session_user', JSON.stringify(updatedUser));
      }

      // 3. Sync to Backend
      await fetch(`${API_URL}?route=users/update`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updatedUser)
      });
  };
  
  const handleDeleteUser = async (email: string) => {
      // 1. Update Local State
      setUsersList(prev => prev.filter(u => u.email !== email));
      
      // 2. Sync to Backend
      await fetch(`${API_URL}?route=users/delete`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email })
      });
      showToast('Сотрудник уволен', 'info');
  };

  // Staff handling
  const handleStaffRequest = async (id: string, action: 'approve' | 'reject') => {
      if (action === 'approve') {
          const req = promotionRequests.find(r => r.id === id);
          if (req) {
              const targetUser = usersList.find(u => u.email === req.userEmail);
              if (targetUser) {
                  const updatedTarget = { ...targetUser, position: req.requestedPosition };
                  
                  // Update using shared handler to ensure session sync
                  handleUpdateUser(updatedTarget);
                  
                  showToast(`Повышение одобрено: ${targetUser.fullName}`, 'success');
              }
          }
      }
      // Remove request
      setPromotionRequests(prev => prev.filter(r => r.id !== id));
      await fetch(`${API_URL}?route=promotions/delete`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ id })
      });
  };
  
  // Ban Handlers
  const handleBanIp = async (ip: string) => {
      setBannedIps(prev => [...prev, { ip, bannedAt: new Date().toISOString() }]);
      await fetch(`${API_URL}?route=admin/ban`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ip })
      });
      showToast(`IP ${ip} заблокирован`, 'error');
  };

  const handleUnbanIp = async (ip: string) => {
      setBannedIps(prev => prev.filter(b => b.ip !== ip));
      await fetch(`${API_URL}?route=admin/unban`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ip })
      });
      showToast(`IP ${ip} разблокирован`, 'success');
  };

  const handleDeleteDoc = async (id: string) => {
      setDocuments(prev => prev.filter(d => d.id !== id));
      await fetch(`${API_URL}?route=documents/delete`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ id })
      });
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold animate-pulse">Загрузка системы DOJ...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} users={usersList} />;
  }

  const isCreator = user.email === CREATOR_LOGIN;
  const showFineInputs = (docType === 'resolution' && (subTemplate === 'article_5_2' || subTemplate === 'admin_responsibility'));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 relative`}>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right-10 fade-in duration-300 dark:bg-slate-800 dark:border-slate-700 ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800 dark:text-green-400' : ''} ${toast.type === 'error' ? 'bg-white border-red-200 text-red-800 dark:text-red-400' : ''} ${toast.type === 'info' ? 'bg-white border-blue-200 text-blue-800 dark:text-blue-400' : ''}`}>
                  {toast.type === 'success' && <CheckCircle2 size={20} className="text-green-600 dark:text-green-500 shrink-0"/>}
                  {toast.type === 'error' && <AlertCircle size={20} className="text-red-600 dark:text-red-500 shrink-0"/>}
                  {toast.type === 'info' && <Info size={20} className="text-blue-600 dark:text-blue-500 shrink-0"/>}
                  <span className="font-medium text-sm">{toast.message}</span>
              </div>
          ))}
      </div>

      <header className="bg-slate-900 dark:bg-slate-950 text-white p-4 shadow-md sticky top-0 z-50 print:hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl shadow-inner">⚖️</div>
             <h1 className="font-bold text-lg hidden sm:block">DOJ System</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                 <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors relative">
                    <Bell size={20} className="text-slate-200" />
                    {unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">{unreadCount}</div>}
                 </button>
                 {showNotifications && (
                     <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                         <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                             <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Уведомления</h3>
                             <button onClick={() => setNotifications([])} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Очистить</button>
                         </div>
                         <div className="max-h-[300px] overflow-y-auto">
                             {notifications.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Нет новых уведомлений</div> : notifications.map(n => (
                                 <div key={n.id} className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                                     <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                                     <div className="text-xs text-slate-600 dark:text-slate-400">{n.message}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
             <div className="text-right hidden md:block">
               <div className="font-semibold text-sm">{user.fullName}</div>
               <div className="text-xs text-slate-400">{user.position}</div>
             </div>
             <button onClick={() => setUser(null)} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white" title="Выйти"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-[72px] z-40 print:hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[{ id: 'create', icon: FilePlus, label: 'Создать' }, { id: 'cases', icon: Briefcase, label: 'Дела' }, { id: 'library', icon: BookOpen, label: 'Архив' }, { id: 'fines', icon: Banknote, label: 'Штрафы' }, { id: 'profile', icon: UserIcon, label: 'Профиль' }, { id: 'staff', icon: Users, label: 'Состав' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <tab.icon size={18} />{tab.label}
              {tab.id === 'staff' && isCreator && promotionRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{promotionRequests.length}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        {activeTab === 'create' && (
          <div className="max-w-[1600px] mx-auto p-6">
             {/* ... Create Tab Content ... */}
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
               <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5 sticky top-6 print:hidden transition-colors duration-300">
                 <h2 className="text-xl font-bold flex items-center gap-2 border-b dark:border-slate-700 pb-4 text-slate-800 dark:text-slate-100"><span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><FilePlus size={20}/></span>Конструктор Документа</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Тип документа</label><select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"><option value="resolution">Постановление</option><option value="decree">Указ</option></select></div>
                   {docType === 'resolution' && (<div className="md:col-span-2"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Шаблон</label><select value={subTemplate} onChange={(e) => handleTemplateChange(e.target.value)} className="w-full p-2.5 bg-indigo-50 dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium">{Object.entries(RESOLUTION_TEMPLATES).map(([key, tpl]) => (<option key={key} value={key}>{tpl.label}</option>))}</select></div>)}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Номер документа</label><input type="text" value={docData.number} onChange={(e) => handleDocChange('number', e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono dark:text-slate-200" placeholder="XXX-№XXX"/></div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Дата</label><input type="date" value={docData.date} onChange={(e) => handleDocChange('date', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"/></div>
                 </div>
                 {showFineInputs && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400 font-bold mb-3 border-b border-yellow-200 dark:border-yellow-700/50 pb-2"><Banknote size={18} /> Данные для реестра штрафов</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Имя Нарушителя</label><input className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-yellow-500 bg-white dark:bg-slate-900 dark:text-slate-200" placeholder="Имя Фамилия" value={fineDefendant} onChange={(e) => setFineDefendant(e.target.value)}/></div>
                            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Сумма штрафа</label><input className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-yellow-500 bg-white dark:bg-slate-900 dark:text-slate-200" placeholder="50.000$" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)}/></div>
                            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Статья</label><input className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-yellow-500 bg-white dark:bg-slate-900 dark:text-slate-200" placeholder="15.6 УАК" value={fineArticle} onChange={(e) => setFineArticle(e.target.value)}/></div>
                            <div><label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Срок уплаты (часов)</label><input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-yellow-500 bg-white dark:bg-slate-900 dark:text-slate-200" placeholder="48" value={fineDuration} onChange={(e) => setFineDuration(e.target.value)}/></div>
                        </div>
                    </div>
                 )}
                 <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Тема (Заголовок)</label><RichTextEditor minHeight="60px" value={docData.subject || ''} onChange={(val) => handleDocChange('subject', val)}/></div>
                 <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Преамбула (Введение)</label><RichTextEditor minHeight="80px" value={docData.basis || ''} onChange={(val) => handleDocChange('basis', val)}/></div>
                 <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Основная часть (Пункты)</label><RichTextEditor minHeight="200px" value={docData.points || ''} onChange={(val) => handleDocChange('points', val)}/></div>
                 <div className="grid grid-cols-1 gap-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Сроки / Пункт X</label><RichTextEditor minHeight="60px" value={docData.deadline || ''} onChange={(val) => handleDocChange('deadline', val)}/></div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ответственность / Пункт Y</label><RichTextEditor minHeight="60px" value={docData.responsibility || ''} onChange={(val) => handleDocChange('responsibility', val)}/></div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Вступление в силу / Пункт Z</label>
                      <RichTextEditor minHeight="60px" value={docData.effective || ''} onChange={(val) => handleDocChange('effective', val)} className="mb-2"/>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 mt-2">Предупреждение в подвале (опционально)</label>
                      <input type="text" value={docData.warning} onChange={(e) => handleDocChange('warning', e.target.value)} className="w-full p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm" placeholder="Уклонение влечет уголовную ответственность..."/>
                    </div>
                 </div>
                 <div className="pt-4 border-t dark:border-slate-700 flex flex-wrap gap-3">
                   <button onClick={handlePublish} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Save size={18}/> Опубликовать</button>
                   <button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95" title="Скачать PDF (Ссылки активны)"><Download size={18}/> Скачать PDF</button>
                   <button onClick={() => handleCopyImage(previewRef)} className="bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95" title="Сохранить как картинку (ссылки не работают)"><Copy size={18}/> PNG</button>
                 </div>
               </div>
               <div className="flex justify-center bg-slate-300/50 dark:bg-slate-950 p-6 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner print:bg-transparent print:p-0 print:border-none print:shadow-none print:block print:overflow-visible transition-colors duration-300">
                 <div className="origin-top transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform print:transform-none print:scale-100">
                    <DocumentPreview forwardRef={previewRef} user={user} data={{...docData, type: docType}} />
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'cases' && (
           <div className="max-w-[1600px] mx-auto p-6">
              {caseViewMode === 'list' && (
                  <div>
                      <div className="flex justify-between items-center mb-6">
                           <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><Briefcase className="text-blue-600" /> Делопроизводства (Case Files)</h2>
                           <button onClick={() => { setCaseViewMode('edit'); setCaseData(DEFAULT_CASE_FILE); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Новое дело</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {caseFiles.map(c => (
                               <div key={c.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => { setCaseData(c); setCaseViewMode('view'); }}>
                                    <div className="flex justify-between mb-4">
                                        <span className="font-bold font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-200">{c.number}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${c.status === 'OPEN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{c.status}</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 line-clamp-2 dark:text-white">{c.reason}</h3>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ведущий: {c.author}</div>
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:underline"><FolderOpen size={16}/> Открыть дело</div>
                               </div>
                           ))}
                      </div>
                  </div>
              )}
              {caseViewMode === 'view' && (
                   <div className="flex flex-col items-center">
                       <div className="w-full max-w-5xl flex justify-between items-center mb-6 print:hidden">
                            <button onClick={() => setCaseViewMode('list')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"><ArrowLeft size={20} /> Назад к списку</button>
                            <div className="flex gap-2">
                                <button onClick={() => setCaseViewMode('edit')} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"><Edit size={18} /> Редактировать</button>
                                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"><Download size={18} /> Скачать PDF</button>
                                <button onClick={handleDownloadWord} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm" title="Скачать для Google Docs"><FilePlus size={18} /> Google Docs</button>
                            </div>
                       </div>
                       <div className="bg-slate-300/50 dark:bg-slate-950 p-6 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner w-full flex justify-center print:bg-transparent print:p-0 print:border-none print:shadow-none print:block">
                            <div className="origin-top transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform print:transform-none">
                                 <CaseFilePreview forwardRef={casePreviewRef} user={user} data={caseData} />
                            </div>
                       </div>
                   </div>
              )}
              {caseViewMode === 'edit' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6 sticky top-6 max-h-[90vh] overflow-y-auto print:hidden">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4"><h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Briefcase size={20} className="text-blue-600"/> Редактор Дела</h2><button onClick={() => setCaseViewMode('list')} className="text-sm text-slate-500 hover:text-blue-600 underline">Назад к списку</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Номер дела</label><input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={caseData.number || ''} onChange={e => handleCaseChange('number', e.target.value)} placeholder="DJC-XXXX" /></div>
                             <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Статус</label><select className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={caseData.status} onChange={e => handleCaseChange('status', e.target.value as any)}><option value="OPEN">Открыто</option><option value="CLOSED">Закрыто</option></select></div>
                             <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Дата открытия</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={caseData.dateOpened || ''} onChange={e => handleCaseChange('dateOpened', e.target.value)} /></div>
                             <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Дата закрытия</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={caseData.dateClosed || ''} onChange={e => handleCaseChange('dateClosed', e.target.value)} /></div>
                        </div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Причина возбуждения (Название дела)</label><input className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={caseData.reason || ''} onChange={e => handleCaseChange('reason', e.target.value)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Субъекты (Истец)</label><RichTextEditor minHeight="60px" value={caseData.plaintiff || ''} onChange={val => handleCaseChange('plaintiff', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Субъекты (Ответчик)</label><RichTextEditor minHeight="60px" value={caseData.defendant || ''} onChange={val => handleCaseChange('defendant', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Протокол дела</label><RichTextEditor minHeight="150px" value={caseData.protocol || ''} onChange={val => handleCaseChange('protocol', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Описание ситуации</label><RichTextEditor minHeight="100px" value={caseData.description || ''} onChange={val => handleCaseChange('description', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Следственные мероприятия</label><RichTextEditor minHeight="80px" value={caseData.measures || ''} onChange={val => handleCaseChange('measures', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Материалы дела (Ссылки)</label><RichTextEditor minHeight="80px" value={caseData.materials || ''} onChange={val => handleCaseChange('materials', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Заключение</label><RichTextEditor minHeight="80px" value={caseData.conclusion || ''} onChange={val => handleCaseChange('conclusion', val)} /></div>
                        <div><label className="block text-sm font-semibold mb-1 dark:text-slate-300">Решение</label><RichTextEditor minHeight="80px" value={caseData.decision || ''} onChange={val => handleCaseChange('decision', val)} /></div>
                        <div className="pt-4 border-t dark:border-slate-700 flex flex-wrap gap-3">
                           <button onClick={handleSaveCase} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"><Save size={18}/> Сохранить дело</button>
                           <button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95" title="Скачать PDF (Ссылки активны)"><Download size={18}/> Скачать PDF</button>
                        </div>
                     </div>
                     <div className="flex justify-center bg-slate-300/50 dark:bg-slate-950 p-6 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner print:bg-transparent print:p-0 print:border-none print:shadow-none print:block print:overflow-visible">
                        <div className="origin-top transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform print:transform-none">
                             <CaseFilePreview forwardRef={casePreviewRef} user={user} data={caseData} />
                        </div>
                     </div>
                  </div>
              )}
           </div>
        )}

        {activeTab === 'library' && (
          <Library documents={documents} user={user} onDelete={handleDeleteDoc} onEdit={(doc) => {
              setDocType(doc.type);
              setDocData({ number: doc.number, date: doc.date, subject: doc.subject, basis: doc.basis, points: doc.points, deadline: doc.deadline, responsibility: doc.responsibility, effective: doc.effective, warning: doc.warning });
              setActiveTab('create');
            }}
          />
        )}
        {activeTab === 'fines' && (
          <Fines fines={fines} user={user} onUpdateFine={handleUpdateFine} onCreateCase={handleCreateCaseFromFine}/>
        )}
        {activeTab === 'profile' && (
          <Profile user={user} onUpdateUser={handleUpdateUser} onRequestPromotion={handleRequestPromotion} isCreator={isCreator} pendingRequest={promotionRequests.find(r => r.userEmail === user.email)} theme={theme} onToggleTheme={toggleTheme} />
        )}
        {activeTab === 'staff' && (
          <Staff 
            currentUser={user} 
            promotionRequests={promotionRequests} 
            onHandleRequest={handleStaffRequest} 
            allUsers={usersList} 
            onUpdateUser={handleUpdateUser} 
            onDeleteUser={handleDeleteUser} 
            bannedIps={bannedIps}
            onBanIp={handleBanIp}
            onUnbanIp={handleUnbanIp}
          />
        )}
      </main>
    </div>
  );
};

export default App;