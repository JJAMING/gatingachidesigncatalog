
import React, { useState, useCallback, useRef } from 'react';
import { 
  CreditCard, 
  UserCircle, 
  FileText, 
  Layout, 
  ImageIcon, 
  Stethoscope, 
  ClipboardList, 
  ShieldCheck, 
  ShoppingBag, 
  Mail, 
  Flag, 
  Coffee, 
  AlertCircle, 
  CheckSquare, 
  ChevronRight, 
  ChevronLeft,
  X,
  Check,
  Trash2,
  ShoppingBasket,
  Minus,
  Plus,
  MapPin,
  Clock,
  MessageCircle
} from 'lucide-react';

// --- Types & Constants ---

interface CatalogItem {
  id: string;
  icon: React.ReactNode;
  desc: string;
  specs: string;
  type: 'identity' | 'document' | 'marketing' | 'package';
}

interface CartItem {
  cartId: string;
  id: string;
  name: string;
  size: string;
  paper: string;
  quantity: number;
  icon: React.ReactNode;
}

interface Category {
  title: string;
  subtitle: string;
  items: CatalogItem[];
}

const THEME = {
  primary: "bg-[#5B3E31]", 
  primaryText: "text-[#5B3E31]",
  secondary: "bg-[#F5F5F3]", 
  bg: "bg-[#EAECE9]", 
  accent: "text-[#5B3E31]",
  border: "border-[#5B3E31]/20",
  hover: "hover:bg-[#5B3E31]"
};

const CATEGORIES: Category[] = [
  {
    title: "Identity Branding",
    subtitle: "브랜드의 첫인상을 결정짓는 도구",
    items: [
      { id: "명함", icon: <CreditCard />, desc: "비즈니스의 시작, 프리미엄 후가공 제안", specs: "90x50mm / 반누보 250g", type: 'identity' },
      { id: "명찰", icon: <UserCircle />, desc: "소속감과 신뢰를 주는 알루미늄 자석 명찰", specs: "70x20mm / 무광 은/금박", type: 'identity' }
    ]
  },
  {
    title: "Consulting Docs",
    subtitle: "체계적인 상담을 위한 전문 서식",
    items: [
      { id: "초진문진표", icon: <FileText />, desc: "고객 정보를 정확하게 파악하는 레이아웃", specs: "A4 / 모조지 100g", type: 'document' },
      { id: "치료계획서", icon: <Stethoscope />, desc: "상담 질을 높이는 시각화 프로세스 차트", specs: "A4 / 2단 접지 / 150g", type: 'document' },
      { id: "접수증", icon: <ClipboardList />, desc: "신속하고 효율적인 정보 수집 양식", specs: "A6 / 모조지 80g / 떡제본", type: 'document' }
    ]
  },
  {
    title: "Legal & Privacy",
    subtitle: "안전한 컨설팅을 위한 법적 동의",
    items: [
      { id: "동의서", icon: <CheckSquare />, desc: "정확한 고지와 서명을 유도하는 클린 서식", specs: "A4 / 모조지 80g", type: 'document' },
      { id: "주의사항", icon: <AlertCircle />, desc: "중요 안내를 직관적인 아이콘으로 표현", specs: "A5 / 아트지 150g", type: 'document' }
    ]
  },
  {
    title: "Facility Marketing",
    subtitle: "공간에 가치를 더하는 홍보 및 편의",
    items: [
      { id: "클린매트", icon: <Layout />, desc: "입구에서부터 브랜드 아이덴티티 노출", specs: "900x1200mm / 특수 나일론", type: 'marketing' },
      { id: "종이컵", icon: <Coffee />, desc: "대기 공간의 세심한 배려", specs: "6.5oz / 친환경 수성 코팅", type: 'marketing' },
      { id: "포스터", icon: <ImageIcon />, desc: "시각적 임팩트로 핵심 가치 전달", specs: "A2 / 유포지 / 무광 코팅", type: 'marketing' }
    ]
  },
  {
    title: "Space & Display",
    subtitle: "내외관의 시각적 통일성을 위한 연출",
    items: [
      { id: "배너", icon: <Flag />, desc: "정보 전달과 방향 안내를 위한 홍보물", specs: "600x1800mm / PET", type: 'marketing' }
    ]
  },
  {
    title: "Package & Admin",
    subtitle: "전달의 품격을 높이는 패키지 시스템",
    items: [
      { id: "쇼핑백", icon: <ShoppingBag />, desc: "견고한 마감의 브랜드 패키지", specs: "260x100x350mm / 200g", type: 'package' },
      { id: "편지봉투", icon: <Mail />, desc: "격식을 갖춘 비즈니스 레터 전용 봉투", specs: "소(220x105) / 대(330x245)", type: 'package' },
      { id: "보증서", icon: <ShieldCheck />, desc: "서비스의 신뢰를 확증하는 프리미엄 카드", specs: "90x50mm / 블랙특수지", type: 'package' }
    ]
  }
];

// --- Sub-components ---

const BrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  const isLarge = size === 'lg';
  const isMedium = size === 'md';
  const color = "#5B3E31"; 

  const getH1Size = () => {
    if (isLarge) return 'text-4xl sm:text-5xl';
    if (isMedium) return 'text-3xl sm:text-4xl';
    return 'text-xl sm:text-2xl';
  }

  const getSubSize = () => {
    if (isLarge) return 'text-lg sm:text-xl';
    if (isMedium) return 'text-[12px] sm:text-sm';
    return 'text-[9px] sm:text-[10px]';
  }

  return (
    <div className={`flex flex-col select-none ${isLarge || isMedium ? 'items-center' : 'items-start'}`}>
      <h1 
        className={`${getH1Size()} font-bold tracking-tight leading-none mb-1 sm:mb-2`}
        style={{ color, fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        같이<span className="font-serif italic mx-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>n</span>가치
      </h1>
      <div 
        className={`${getSubSize()} font-medium flex items-center gap-0.5 sm:gap-1.5`}
        style={{ color, fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <span>병</span><span className="opacity-20">/</span>
        <span>원</span><span className="opacity-20">/</span>
        <span>컨</span><span className="opacity-20">/</span>
        <span>설</span><span className="opacity-20">/</span>
        <span>팅</span>
      </div>
    </div>
  );
};

const PageDot: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`h-1 transition-all duration-300 rounded-full ${active ? `bg-[#5B3E31] w-4 sm:w-8` : 'bg-stone-300 w-1.5 sm:w-2'}`}
  />
);

// --- New Item Preview Component ---
const ItemPreview: React.FC<{ 
  item: CatalogItem; 
  isAdmin: boolean; 
  customImages: string[]; 
  onUpload: (index: number, base64: string) => void;
  onZoom: (content: React.ReactNode | string) => void;
}> = ({ item, isAdmin, customImages, onUpload, onZoom }) => {
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(index, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderDraft = (index: number, title: string, content: React.ReactNode) => {
    const customImg = customImages[index];
    const displayContent = customImg ? (
      <img src={customImg} className="w-full h-full object-cover" alt={`Draft ${index + 1}`} referrerPolicy="no-referrer" />
    ) : content;

    return (
      <div className="flex flex-col gap-2 group">
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
            Draft {index + 1}. {title}
          </span>
          {isAdmin && (
            <button 
              onClick={() => fileInputRefs[index].current?.click()}
              className="text-[9px] font-bold text-[#5B3E31] bg-[#5B3E31]/10 px-2 py-0.5 rounded hover:bg-[#5B3E31] hover:text-white transition-colors"
            >
              이미지 첨부
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRefs[index]} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleFileChange(index, e)} 
          />
        </div>
        <div 
          onClick={() => onZoom(customImg || content)}
          className="relative w-full bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-[#5B3E31]/20 transition-all"
        >
          {displayContent}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
             <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
                <Layout size={16} className="text-[#5B3E31]" />
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIdentity = () => (
    <div className="space-y-6">
      {renderDraft(0, "Minimal Classic", (
        <div className="aspect-[90/50] p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white text-xs font-bold">V</div>
            <div className="font-bold text-lg tracking-tight">같이n가치</div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400">Representative Director</p>
            <p className="text-xl font-bold tracking-widest">KIM GACHI</p>
          </div>
        </div>
      ))}
      {renderDraft(1, "Modern Grid", (
        <div className="aspect-[90/50] bg-stone-900 text-white p-6 grid grid-cols-2">
          <div className="flex flex-col justify-center border-r border-white/10 pr-4">
            <p className="text-[8px] opacity-50 uppercase tracking-widest">Identity</p>
            <h5 className="text-lg font-bold">Value Clinic</h5>
          </div>
          <div className="flex flex-col justify-center pl-4 space-y-1">
            <p className="text-[10px] font-bold">김가치 원장</p>
            <p className="text-[7px] opacity-60">T. 02-123-4567</p>
            <p className="text-[7px] opacity-60">E. value@clinic.com</p>
          </div>
        </div>
      ))}
      {renderDraft(2, "Organic Soft", (
        <div className="aspect-[90/50] bg-[#F5F2ED] p-6 flex items-center justify-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="w-full h-full border-8 border-stone-800 rounded-full scale-150"></div>
          </div>
          <div className="text-center z-10">
            <div className="font-serif italic text-2xl text-stone-800 mb-2">Value & Co.</div>
            <div className="w-12 h-[1px] bg-stone-300 mx-auto mb-2"></div>
            <p className="text-[9px] text-stone-500 tracking-[0.3em]">PREMIUM BRANDING</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDocument = () => (
    <div className="space-y-6">
      {renderDraft(0, "Structured Layout", (
        <div className="aspect-[210/297] p-8 space-y-4">
          <div className="flex justify-between items-end border-b-2 border-stone-800 pb-2">
            <h5 className="text-xl font-bold">{item.id}</h5>
            <span className="text-[8px] text-stone-400">DOC NO. 2024-V01</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-4 bg-stone-50 border border-stone-100 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-stone-50 border border-stone-100 rounded flex items-center justify-center">
            <span className="text-[10px] text-stone-300">Main Content Area</span>
          </div>
        </div>
      ))}
      {renderDraft(1, "Clean Minimal", (
        <div className="aspect-[210/297] p-8 flex flex-col">
          <div className="mb-8">
            <div className="text-[10px] font-bold text-stone-400 mb-1">WITH VALUE N GACHI</div>
            <h5 className="text-2xl font-light tracking-tight">{item.id}</h5>
          </div>
          <div className="flex-grow space-y-6">
            <div className="h-[1px] bg-stone-100 w-full"></div>
            <div className="h-[1px] bg-stone-100 w-full"></div>
            <div className="h-[1px] bg-stone-100 w-full"></div>
          </div>
          <div className="mt-auto text-[8px] text-stone-300 text-center italic">
            * 본 서식은 가치n가치 디자인 솔루션에 의해 제작되었습니다.
          </div>
        </div>
      ))}
      {renderDraft(2, "Visual Infographic", (
        <div className="aspect-[210/297] bg-stone-50 p-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-white">
                {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
              </div>
              <h5 className="font-bold">{item.id} 안내</h5>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <div className="bg-stone-50 rounded-xl p-4"></div>
              <div className="bg-stone-50 rounded-xl p-4"></div>
              <div className="col-span-2 bg-stone-50 rounded-xl p-4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      {renderDraft(0, "Brand Impact", (
        <div className="aspect-video bg-stone-800 flex items-center justify-center p-10 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          </div>
          <div className="text-center z-10">
            <h5 className="text-white text-3xl font-black tracking-tighter mb-2">VALUE EXPERIENCE</h5>
            <p className="text-white/40 text-[10px] tracking-[0.5em]">GATI N GACHI SOLUTION</p>
          </div>
        </div>
      ))}
      {renderDraft(1, "Soft Ambient", (
        <div className="aspect-video bg-[#EAECE9] p-8 flex items-center justify-between">
          <div className="w-1/2 space-y-2">
            <h5 className="text-2xl font-bold text-stone-800 leading-tight">공간의 가치를<br/>더하는 디자인</h5>
            <div className="w-8 h-1 bg-stone-800"></div>
          </div>
          <div className="w-1/3 aspect-square bg-white rounded-full shadow-xl flex items-center justify-center">
            <div className="w-1/2 h-1/2 border-2 border-stone-100 rounded-full"></div>
          </div>
        </div>
      ))}
      {renderDraft(2, "Typographic Focus", (
        <div className="aspect-video bg-white p-8 flex flex-col justify-center items-center">
          <div className="text-6xl font-black text-stone-100 absolute select-none">GACHI</div>
          <div className="z-10 text-center">
            <p className="text-[10px] font-bold text-stone-400 mb-2">PREMIUM FACILITY</p>
            <h5 className="text-xl font-bold text-stone-900">{item.id} 솔루션</h5>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPackage = () => (
    <div className="space-y-6">
      {renderDraft(0, "Luxury Gold/Silver", (
        <div className="aspect-square bg-stone-900 p-10 flex flex-col items-center justify-center">
          <div className="w-32 h-32 border border-yellow-500/30 rounded-full flex items-center justify-center p-4">
            <div className="w-full h-full border border-yellow-500/50 rounded-full flex items-center justify-center">
              <span className="text-yellow-500 font-serif italic text-4xl">V</span>
            </div>
          </div>
          <p className="mt-6 text-yellow-500/80 text-[10px] tracking-[0.4em] font-bold">PREMIUM PACKAGE</p>
        </div>
      ))}
      {renderDraft(1, "Eco Friendly", (
        <div className="aspect-square bg-[#D2C8BA] p-10 flex flex-col justify-end">
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl border border-white/30">
            <h5 className="text-stone-800 font-bold text-lg mb-1">{item.id}</h5>
            <p className="text-stone-700 text-[9px] opacity-60">Sustainable Brand Solution</p>
          </div>
        </div>
      ))}
      {renderDraft(2, "Modern Pattern", (
        <div className="aspect-square bg-white p-0 flex flex-col">
          <div className="h-1/2 bg-stone-800 grid grid-cols-4 p-2 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-sm"></div>
            ))}
          </div>
          <div className="h-1/2 p-6 flex flex-col justify-center items-center">
            <h5 className="font-black text-2xl tracking-tighter text-stone-800">{item.id}</h5>
            <div className="w-10 h-0.5 bg-stone-200 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (item.type) {
      case 'identity': return renderIdentity();
      case 'document': return renderDocument();
      case 'marketing': return renderMarketing();
      case 'package': return renderPackage();
      default: return renderIdentity();
    }
  };

  return (
    <div className="space-y-8">
      {renderContent()}
      <p className="text-center text-[9px] text-stone-300 font-medium italic">
        *실물 제작 시 각 시안에 최적화된 고급 소재를 제안해 드립니다. {isAdmin && "(관리자 모드 활성)"}
      </p>
    </div>
  );
};

const DraftZoomModal: React.FC<{ content: React.ReactNode | string; onClose: () => void }> = ({ content, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
        <X size={32} />
      </button>
      <div 
        className="w-full max-w-5xl max-h-full overflow-auto rounded-2xl shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {typeof content === 'string' ? (
          <img src={content} className="w-full h-auto block" alt="Zoomed Draft" referrerPolicy="no-referrer" />
        ) : (
          <div className="p-10 transform scale-100 origin-top">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailModal: React.FC<{ 
  item: CatalogItem; 
  isAdmin: boolean;
  customImages: string[];
  onUpload: (index: number, base64: string) => void;
  onClose: () => void; 
  onAdd: (size: string, paper: string, quantity: number) => void 
}> = ({ item, isAdmin, customImages, onUpload, onClose, onAdd }) => {
  const [selectedSize, setSelectedSize] = useState(item.id === "명함" ? "90x50mm" : 'A4');
  const [selectedPaper, setSelectedPaper] = useState(item.id === "명함" ? "반누보" : '모조지');
  const [quantity, setQuantity] = useState(1);
  const [zoomContent, setZoomContent] = useState<React.ReactNode | string | null>(null);

  const sizes = item.id === "명함" ? ['90x50mm', 'Custom'] : ['A4', 'A5', 'A6', 'Custom'];
  const papers = ['반누보', '모조지', '스노우', '아트지', '특수지'];

  const handleQuantity = (val: number) => {
    if (quantity + val < 1) return;
    setQuantity(prev => prev + val);
  };

  const isBusinessCard = item.id === "명함";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-500 max-h-[95dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 sm:h-40 bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full text-stone-600 shadow-sm active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
          
          <div className="absolute inset-0 opacity-10 flex flex-wrap gap-2 p-4">
             {[...Array(20)].map((_, i) => (
               <div key={i} className="w-12 h-12 bg-[#5B3E31] rounded-lg"></div>
             ))}
          </div>
          <div className="z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#5B3E31] shadow-lg">
               {React.cloneElement(item.icon as React.ReactElement, { size: 24, strokeWidth: 1.5 })}
            </div>
            <div>
               <h4 className="text-xl font-bold text-stone-900 tracking-tight leading-none mb-1">{item.id}</h4>
               <p className="text-[#5B3E31] text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Visual Solution Draft</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
          {/* Item Specific Visual Presentation */}
          <div className="mb-10">
            <ItemPreview 
              item={item} 
              isAdmin={isAdmin} 
              customImages={customImages} 
              onUpload={onUpload}
              onZoom={setZoomContent}
            />
            <div className="h-[1px] w-full bg-stone-100 my-8"></div>
          </div>

          {zoomContent && <DraftZoomModal content={zoomContent} onClose={() => setZoomContent(null)} />}

          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Size Selection</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                      selectedSize === size 
                      ? 'bg-[#5B3E31] text-white border-[#5B3E31] shadow-md' 
                      : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Paper Type</p>
              <div className="flex flex-wrap gap-2">
                {papers.map(paper => (
                  <button
                    key={paper}
                    onClick={() => setSelectedPaper(paper)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                      selectedPaper === paper 
                      ? 'bg-[#5B3E31] text-white border-[#5B3E31] shadow-md' 
                      : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'
                    }`}
                  >
                    {paper}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Quantity</p>
              <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-100 w-fit">
                <button 
                  onClick={() => handleQuantity(-1)}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 active:scale-90 transition-transform shadow-sm"
                >
                  <Minus size={16} />
                </button>
                <div className="w-12 text-center font-bold text-lg text-stone-800 tabular-nums">
                  {quantity}
                </div>
                <button 
                  onClick={() => handleQuantity(1)}
                  className="w-10 h-10 rounded-xl bg-[#5B3E31] flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onAdd(selectedSize, selectedPaper, quantity)}
            className="w-full mt-10 bg-[#5B3E31] text-white py-4 rounded-2xl font-bold text-sm tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} />
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<{ items: CartItem[]; onClose: () => void; onRemove: (cartId: string) => void }> = ({ items, onClose, onRemove }) => {
  const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-[#F5F5F3] w-full max-w-lg h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-8 pb-4 flex items-center justify-between border-b border-stone-200 bg-white">
          <div>
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">장바구니</h3>
            <p className="text-stone-400 text-xs font-medium">선택하신 디자인 솔루션 리스트</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-stone-100 rounded-full text-stone-500 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
              <ShoppingBasket size={64} strokeWidth={1} className="mb-4" />
              <p className="font-bold text-sm tracking-widest">장바구니가 비어있습니다.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartId} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4 animate-in slide-in-from-right-4">
                <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-[#5B3E31] flex-shrink-0">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 24, strokeWidth: 1.5 })}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-stone-800 text-sm">{item.name}</h4>
                    <span className="text-[10px] font-black text-[#5B3E31] bg-[#5B3E31]/5 px-1.5 py-0.5 rounded-md">{item.quantity}개</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] bg-stone-50 text-stone-400 px-2 py-0.5 rounded-lg border border-stone-100 font-bold">{item.size}</span>
                    <span className="text-[10px] bg-stone-50 text-stone-400 px-2 py-0.5 rounded-lg border border-stone-100 font-bold">{item.paper}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(item.cartId)}
                  className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="p-8 pt-4 bg-white border-t border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-sm text-stone-400 font-bold block">Total Quantity</span>
                <span className="text-[10px] text-stone-300 uppercase font-black tracking-widest">{items.length} types of solutions</span>
              </div>
              <span className="text-2xl font-black text-[#5B3E31] tabular-nums">{totalQuantity}개</span>
            </div>
            <button className="w-full bg-[#5B3E31] text-white py-4 rounded-2xl font-bold text-sm tracking-widest active:scale-[0.98] transition-all">
              견적 문의하기
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('gati_custom_images');
    return saved ? JSON.parse(saved) : {};
  });

  const handleUpload = (itemId: string, index: number, base64: string) => {
    const updated = { ...customImages };
    if (!updated[itemId]) updated[itemId] = [];
    updated[itemId][index] = base64;
    setCustomImages(updated);
    localStorage.setItem('gati_custom_images', JSON.stringify(updated));
  };

  const totalPages = CATEGORIES.length + 2; 

  const handleNext = useCallback(() => {
    if (selectedItem || isCartOpen) return;
    setCurrentPage((p) => (p + 1) % totalPages);
  }, [totalPages, selectedItem, isCartOpen]);

  const handlePrev = useCallback(() => {
    if (selectedItem || isCartOpen) return;
    setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
  }, [totalPages, selectedItem, isCartOpen]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || selectedItem || isCartOpen) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) handleNext();
    else if (distance < -50) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const addToCart = (size: string, paper: string, quantity: number) => {
    if (!selectedItem) return;
    const newCartItem: CartItem = {
      cartId: `${selectedItem.id}-${size}-${paper}-${Date.now()}`,
      id: selectedItem.id,
      name: selectedItem.id,
      size,
      paper,
      quantity,
      icon: selectedItem.icon
    };
    setCartItems(prev => [...prev, newCartItem]);
    setSelectedItem(null);
  };

  const removeFromCart = (cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.bg} text-stone-800 p-4 overflow-hidden`}>
      <header className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="active:scale-95 transition-transform" onClick={() => { setCurrentPage(0); setSelectedItem(null); }}>
          <BrandLogo size="sm" />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-4 bg-white/80 backdrop-blur-lg px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-stone-200 shadow-sm">
            <button onClick={handlePrev} className="p-1 text-stone-400 active:text-[#5B3E31]">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1 sm:gap-1.5 items-center">
              {[...Array(totalPages)].map((_, i) => (
                <PageDot key={i} active={currentPage === i} onClick={() => setCurrentPage(i)} />
              ))}
            </div>
            <button onClick={handleNext} className="p-1 text-stone-400 active:text-[#5B3E31]">
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center text-stone-600 border border-stone-200 shadow-sm active:scale-90 transition-transform flex-shrink-0"
          >
            <ShoppingBag size={18} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#5B3E31] text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow relative mb-3 sm:mb-4" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="h-full bg-[#F5F5F3] rounded-[2.5rem] shadow-xl overflow-hidden border border-white flex flex-col transition-all duration-500">
          
          {currentPage === 0 ? (
            /* --- Front Cover --- */
            <div className="h-full flex flex-col items-center justify-between py-10 px-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-1/4 left-0 w-64 h-64 bg-[#D2C8BA] rounded-full blur-[80px] animate-blob"></div>
                <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-[#C6CCD2] rounded-full blur-[80px] animate-blob animation-delay-2000"></div>
              </div>
              <div className="z-10 mt-8"><BrandLogo size="lg" /></div>
              <div className="z-10 flex flex-col items-center w-full">
                <p className="text-[9px] tracking-[0.5em] font-bold text-[#5B3E31]/40 uppercase mb-8">Premium Brand Identity</p>
                <div className="w-full max-w-[340px] px-2">
                  <h3 className="text-[15px] sm:text-[17px] font-medium text-[#5B3E31] leading-[1.8] flex flex-col items-center drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                    <span className="block whitespace-nowrap tracking-tight">우리 병원이란 브랜드가 고객에게 닿는 첫 순간,</span>
                    <span className="block whitespace-nowrap mt-1 tracking-tight">
                      <span className="font-bold relative inline-block">같이n가치
                        <span className="absolute left-0 bottom-1 w-full h-[6px] bg-[#5B3E31]/10 -z-10"></span>
                      </span>가 그 경험의 품격을 디자인합니다.
                    </span>
                  </h3>
                  <div className="mt-8 flex justify-center opacity-20"><div className="w-12 h-[1px] bg-[#5B3E31]"></div></div>
                </div>
              </div>
              <div className="z-10 mb-2">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="w-8 h-[1px] bg-stone-300"></div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Solution Portfolio</span>
                  <div className="w-8 h-[1px] bg-stone-300"></div>
                </div>
                <p className="text-[9px] text-stone-300 font-bold tracking-tighter uppercase">Designed by 같이n가치 creative team</p>
              </div>
            </div>
          ) : currentPage === totalPages - 1 ? (
            /* --- Back Cover --- */
            <div className="h-full flex flex-col items-center justify-center py-12 px-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D2C8BA] rounded-full blur-[100px] animate-blob"></div>
              </div>
              
              <div className="z-10 opacity-80 mb-12"><BrandLogo size="md" /></div>
              
              <div className="z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-[1px] bg-[#5B3E31]/20 mb-6"></div>
                <p className="text-sm font-medium text-[#5B3E31] tracking-tight mb-1">
                  Premium Brand Identity
                </p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">
                  Designed by 같이n가치 creative team
                </p>
                <div className="w-8 h-[1px] bg-[#5B3E31]/20 mt-6"></div>
              </div>
            </div>
          ) : (
            /* --- Category Pages --- */
            <div className="h-full flex flex-col p-6 sm:p-8">
              <header className="mb-6 flex-shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-white border border-stone-200 text-[#5B3E31] text-[8px] sm:text-[9px] font-black rounded-full uppercase tracking-widest">CH. 0{currentPage}</span>
                  <div className="h-[1px] flex-grow bg-stone-200/50"></div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1 tracking-tight">{CATEGORIES[currentPage - 1].title}</h3>
                <p className="text-stone-400 text-xs sm:text-sm font-medium leading-tight">{CATEGORIES[currentPage - 1].subtitle}</p>
              </header>
              <div className="flex-grow grid grid-cols-2 gap-3 sm:gap-4 overflow-y-auto content-start pr-1 custom-scrollbar">
                {CATEGORIES[currentPage - 1].items.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedItem(item)}
                    className="flex flex-col items-center p-4 sm:p-6 bg-white border border-stone-100 rounded-[2rem] shadow-sm active:scale-95 active:bg-stone-50 transition-all animate-in fade-in zoom-in-95 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-stone-50 text-[#5B3E31] rounded-2xl sm:rounded-3xl flex items-center justify-center mb-3 sm:mb-4 border border-stone-100 shadow-inner">
                      {React.cloneElement(item.icon as React.ReactElement, { size: 24, strokeWidth: 1.2 })}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-800 mb-1">{item.id}</h4>
                    <span className="text-[7px] sm:text-[8px] font-black text-stone-300 uppercase tracking-widest">Detail View</span>
                  </button>
                ))}
              </div>
              <footer className="mt-4 pt-4 flex justify-between items-center border-t border-stone-100 flex-shrink-0">
                <span className="text-[7px] sm:text-[8px] text-stone-400 font-bold uppercase tracking-[0.4em]"> 같이n가치 premium solution</span>
                <div className="text-2xl sm:text-3xl font-black text-stone-200 tabular-nums leading-none">0{currentPage}</div>
              </footer>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {selectedItem && (
          <DetailModal 
            item={selectedItem} 
            isAdmin={isAdmin}
            customImages={customImages[selectedItem.id] || []}
            onUpload={(idx, b64) => handleUpload(selectedItem.id, idx, b64)}
            onClose={() => setSelectedItem(null)} 
            onAdd={addToCart}
          />
        )}

        {/* Cart Modal */}
        {isCartOpen && (
          <CartModal 
            items={cartItems} 
            onClose={() => setIsCartOpen(false)} 
            onRemove={removeFromCart}
          />
        )}
      </main>

      <footer className="text-center flex-shrink-0 pb-2 relative">
        <div className="absolute right-0 bottom-2">
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${isAdmin ? 'bg-[#5B3E31] text-white' : 'text-stone-300 hover:text-stone-400'}`}
          >
            {isAdmin ? 'Admin On' : 'Admin'}
          </button>
        </div>
        <p className="text-stone-400 text-[8px] font-bold tracking-[0.5em] uppercase mb-1">Medical Branding Architecture</p>
        <p className="text-stone-300 text-[8px] opacity-60">© 2024 Gati-n-Gachi. Premium Space Solutions.</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        @keyframes blob { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.1); opacity: 0.6; } }
        .animate-blob { animation: blob 10s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 3s; }
        .animate-in { animation-duration: 400ms; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-bottom-full { animation-name: slide-in-from-bottom-full; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom-full { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-in-from-right-4 { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in-from-right-4 { animation-name: slide-in-from-right-4; }
        @keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .zoom-in-95 { animation-name: zoom-in-95; }
        body { -webkit-font-smoothing: antialiased; word-break: keep-all; background-color: #EAECE9; overscroll-behavior: none; touch-action: pan-y; }
      `}</style>
    </div>
  );
};

export default App;
