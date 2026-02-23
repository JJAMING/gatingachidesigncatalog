import React, { useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
    CreditCard, UserCircle, FileText, Layout, Stethoscope, ClipboardList,
    ShieldCheck, ShoppingBag, Mail, Flag, AlertCircle, CheckSquare,
    ChevronRight, ChevronLeft, X, Check, Trash2, ShoppingBasket,
    Minus, Plus, Upload, Lock, ChevronDown, Settings,
} from 'lucide-react';

/* ================================================================
   Types
   ================================================================ */
interface Draft { id: string; label: string; imageUrls: [string | null, string | null]; }
interface CatalogItem {
    id: string; icon: React.ReactNode; desc: string; specs: string;
    type: 'identity' | 'document' | 'marketing' | 'package';
    drafts: Draft[];
}
interface Category { title: string; subtitle: string; items: CatalogItem[]; }
interface CartItem {
    cartId: string; id: string; name: string; draftLabel: string;
    size: string; paper: string; quantity: number; options: string[];
    icon: React.ReactNode;
}
type SendState = 'idle' | 'form' | 'sending' | 'success' | 'error';

/* ================================================================
   Data helpers
   ================================================================ */
const mkDrafts = (): Draft[] => [
    { id: 'draft1', label: '시안 1', imageUrls: [null, null] },
    { id: 'draft2', label: '시안 2', imageUrls: [null, null] },
    { id: 'draft3', label: '시안 3', imageUrls: [null, null] },
];
function item(id: string, icon: React.ReactNode, desc: string, specs: string, type: CatalogItem['type']): CatalogItem {
    return { id, icon, desc, specs, type, drafts: mkDrafts() };
}

const CATEGORIES: Category[] = [
    {
        title: 'Identity Branding', subtitle: '브랜드의 첫인상을 결정짓는 도구', items: [
            item('명함', <CreditCard />, '비즈니스의 시작, 프리미엄 품격 제안', '90x50mm', 'identity'),
            item('명찰', <UserCircle />, '신뢰를 담은 고품격 브랜드 명찰', '70x25mm', 'identity'),
        ]
    },
    {
        title: 'Consulting Docs', subtitle: '체계적인 상담을 위한 전문 서식', items: [
            item('초진문진표', <FileText />, '고객 정보를 정확하게 파악하는 레이아웃', 'A4', 'document'),
            item('치료계획서', <Stethoscope />, '상담의 질을 높이는 전문 상담 가이드', 'A4/A5', 'document'),
            item('접수증', <ClipboardList />, '신속하고 효율적인 정보 수집 시스템', 'A6', 'document'),
        ]
    },
    {
        title: 'Legal & Privacy', subtitle: '안전한 컨설팅을 위한 법적 동의', items: [
            item('동의서', <CheckSquare />, '정확한 고지와 서명을 유도하는 클린 서식', 'A4/A5', 'document'),
            item('주의사항', <AlertCircle />, '필수 안내를 직관적으로 전달하는 디자인', 'A5/디지털', 'document'),
        ]
    },
    {
        title: 'Facility Marketing', subtitle: '공간에 가치를 더하는 홍보 및 편의', items: [
            item('클린매트', <Layout />, '브랜드 아이덴티티가 돋보이는 디자인', '900x1200mm', 'marketing'),
            item('종이컵', <ShoppingBag />, '대기 공간의 세심한 브랜드 배려', '6.5oz', 'marketing'),
            item('포스터', <FileText />, '임팩트 있는 핵심 가치 전달 솔루션', 'A2', 'marketing'),
        ]
    },
    {
        title: 'Space & Display', subtitle: '내외관의 시각적 통일성을 위한 연출', items: [
            item('배너', <Flag />, '정보 전달과 방향 안내를 위한 홍보 솔루션', '600x1800mm', 'marketing'),
        ]
    },
    {
        title: 'Package & Admin', subtitle: '전달의 품격을 높이는 패키지 시스템', items: [
            item('쇼핑백', <ShoppingBag />, '견고한 마감의 프리미엄 브랜드 패키지', '260x350mm', 'package'),
            item('편지봉투', <Mail />, '격식을 갖춘 비즈니스 전용 봉투', '소/대', 'package'),
            item('보증서', <ShieldCheck />, '신뢰를 확증하는 프리미엄 보증서', '90x50mm', 'package'),
        ]
    },
];

function getSizes(id: string) {
    if (id === '명함') return ['90x50mm'];
    if (id === '명찰') return ['60x20mm', '70x25mm'];
    if (id === '초진문진표') return ['A4(210x294)'];
    if (id === '치료계획서') return ['A4(210x294)', 'A5(148x210)'];
    if (id === '접수증') return ['A6(105x148)'];
    if (id === '동의서') return ['A4(210x297)', 'A5(148x210)'];
    if (id === '주의사항') return ['A5(148x210)', '디지털 동의서(JPEG 파일만)'];
    if (id === '클린매트') return ['A4(297x210)'];
    if (id === '종이컵') return ['6.5온스(70x73mm)'];
    if (id === '포스터') return ['A4(210x297)', 'A5(148x210)'];
    if (id === '배너') return ['600x1800'];
    if (id === '쇼핑백') return ['소(150x201x60)', '대(230x330x100)'];
    if (id === '편지봉투') return ['소봉투(220x105)', '대봉투(330x245)'];
    if (id === '보증서') return ['A4(210x297)'];
    return ['A4', 'A5', 'A6', 'Custom'];
}
function getPapers(id: string) {
    if (id === '명함') return ['일반(양면) - 스노우지 250g', '고급지(양면) - 엑스트라매트 350g'];
    if (id === '명찰') return ['아크릴', '금속-금색', '금속-은색'];
    if (id === '초진문진표') return ['모조지 150g(양면)'];
    if (id === '치료계획서') return ['모조지 80g', '모조지 150g'];
    if (id === '접수증') return ['모조지 80g'];
    if (id === '동의서') return ['모조지 80g', '모조지 150g'];
    if (id === '주의사항') return ['없음', '모조지 150g'];
    if (id === '클린매트') return ['모조지 80g'];
    if (id === '종이컵') return ['100% 무형광 천연펄프'];
    if (id === '포스터') return ['모조지 150g'];
    if (id === '배너') return ['패트', '메쉬', '투명페트', '패브릭'];
    if (id === '쇼핑백') return ['스노우지 180g'];
    if (id === '편지봉투') return ['모조지 120g', '페스티발(체크)'];
    if (id === '보증서') return ['모조지 150g', '랑데뷰 160g'];
    return ['모조지', '스노우지', '아트지', '특수지'];
}
function getQtyOptions(id: string) {
    if (id === '명함') return [200, 300, 400, 500, 700, 1000, 2000, 3000, 5000, 10000];
    if (id === '명찰') return [1, 2, 3, 5, 10, 15, 20, 25, 30];
    if (id === '초진문진표' || id === '치료계획서') return [2000, 3000, 5000, 7000, 10000];
    if (id === '접수증') return [4000, 5000, 7000, 10000];
    if (id === '동의서') return [1000, 2000, 3000, 5000, 10000];
    if (id === '주의사항') return [0, 500, 1000, 2000, 3000, 5000, 10000];
    if (id === '클린매트' || id === '종이컵') return [1000, 2000, 3000, 5000, 10000];
    if (id === '포스터' || id === '배너') return [1, 2, 3, 5, 10, 15, 20, 30, 50, 100];
    if (id === '쇼핑백') return [200, 300, 500, 1000, 2000];
    if (id === '편지봉투' || id === '보증서') return [500, 1000, 2000, 3000, 5000];
    return [10, 20, 30, 50, 100, 200, 500];
}
function getMinQty(id: string) {
    if (id === '명함') return 200;
    if (id === '명찰') return 1;
    if (id === '초진문진표' || id === '치료계획서') return 2000;
    if (id === '접수증') return 4000;
    if (id === '동의서') return 1000;
    if (id === '주의사항') return 0;
    if (id === '클린매트' || id === '종이컵') return 1000;
    if (id === '포스터' || id === '배너') return 1;
    if (id === '쇼핑백') return 200;
    if (id === '편지봉투' || id === '보증서') return 500;
    return 1;
}

const SERVER = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : `http://${window.location.hostname}:4000`)
    : 'http://localhost:4000';

/* ================================================================
   BrandLogo (이전 디자인 유지)
   ================================================================ */
const BrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
    const lg = size === 'lg', md = size === 'md';
    return (
        <div className={`flex flex-col select-none ${lg || md ? 'items-center' : 'items-start'}`}>
            <h1 className={`${lg ? 'text-4xl' : md ? 'text-3xl' : 'text-xl'} font-bold tracking-tight leading-none mb-1`}
                style={{ color: '#5B3E31', fontFamily: "'Noto Sans KR',sans-serif" }}>
                같이<span className="font-serif italic mx-0.5" style={{ fontFamily: "'Playfair Display',serif" }}>n</span>가치
            </h1>
            <div className={`${lg ? 'text-base' : md ? 'text-[11px]' : 'text-[9px]'} font-medium flex items-center gap-0.5`} style={{ color: '#5B3E31' }}>
                <span>병</span><span className="opacity-20">/</span><span>원</span><span className="opacity-20">/</span>
                <span>컨</span><span className="opacity-20">/</span><span>설</span><span className="opacity-20">/</span><span>팅</span>
            </div>
        </div>
    );
};

/* ================================================================
   CategoryPopup – 카테고리 클릭 시 아이템 목록 팝업
   ================================================================ */
const CategoryPopup: React.FC<{
    cat: Category; onClose: () => void; onSelectItem: (it: CatalogItem) => void;
    liveItems: CatalogItem[];
}> = ({ cat, onClose, onSelectItem, liveItems }) => (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end" onClick={onClose}>
        <div className="w-full max-w-[480px] mx-auto bg-[#F5F5F3] rounded-t-[2rem] shadow-2xl pb-safe"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1)', maxHeight: '85dvh' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-300 rounded-full" /></div>
            {/* Header */}
            <div className="px-5 pt-2 pb-4 border-b border-stone-200/60">
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">{cat.title}</h3>
                <p className="text-xs text-stone-400 font-medium">{cat.subtitle}</p>
            </div>
            {/* Items in vertical list */}
            <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(85dvh - 100px)', WebkitOverflowScrolling: 'touch' }}>
                {cat.items.map((it, idx) => {
                    const live = liveItems.find(x => x.id === it.id);
                    const draftsWithImg = live?.drafts.filter(d => d.imageUrls[0]) ?? [];
                    const cover = draftsWithImg[0]?.imageUrls[0];
                    return (
                        <button key={idx} onClick={() => onSelectItem(it)}
                            className="w-full bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all text-left"
                            style={{ animation: `fadeScale .25s ease ${idx * 40}ms both` }}>
                            {cover ? (
                                <div className="relative">
                                    <img src={cover} alt={it.id} className="w-full h-40 object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    {draftsWithImg.length > 1 && (
                                        <span className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                                            시안 {draftsWithImg.length}
                                        </span>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h4 className="text-sm font-black text-white">{it.id}</h4>
                                        <p className="text-[10px] text-white/80 font-medium">{it.desc}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4">
                                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#5B3E31] border border-stone-100 flex-shrink-0">
                                        {React.cloneElement(it.icon as React.ReactElement, { size: 22, strokeWidth: 1.2 })}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-stone-800 mb-0.5">{it.id}</h4>
                                        <p className="text-[10px] text-stone-400 leading-snug font-medium">{it.desc}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-stone-300 flex-shrink-0" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

/* ================================================================
   DraftViewerModal – 시안 크게 보기 + 선택
   ================================================================ */
const DraftViewerModal: React.FC<{
    draft: Draft;
    idx: number;
    onClose: () => void;
    onSelect: () => void;
}> = ({ draft, idx, onClose, onSelect }) => (
    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-fadeScale" onClick={onClose}>
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-6 pb-4 bg-gradient-to-b from-black/50 to-transparent">
            <h3 className="text-white font-black text-lg">시안 {idx + 1} 상세보기</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"><X size={24} /></button>
        </div>
        <div className="flex-grow overflow-y-auto px-4 pb-20 space-y-6" onClick={e => e.stopPropagation()}>
            {draft.imageUrls[0] ? (
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Front / 앞면</p>
                    <img src={draft.imageUrls[0]} className="w-full h-auto rounded-2xl shadow-2xl border border-white/10" alt="앞면" />
                </div>
            ) : (
                <div className="w-full aspect-[4/3] bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <p className="text-sm text-white/20 font-bold">등록된 앞면 이미지가 없습니다.</p>
                </div>
            )}
            {draft.imageUrls[1] && (
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Back / 뒷면</p>
                    <img src={draft.imageUrls[1]} className="w-full h-auto rounded-2xl shadow-2xl border border-white/10" alt="뒷면" />
                </div>
            )}
        </div>
        <div className="absolute bottom-8 inset-x-4">
            <button onClick={() => { onSelect(); onClose(); }}
                className="w-full py-4 bg-[#5B3E31] text-white rounded-2xl font-black text-base shadow-2xl active:scale-[0.98] transition-all border border-white/20 flex items-center justify-center gap-2">
                <Check size={20} /> 이 시안 선택하기
            </button>
        </div>
    </div>
);

/* ================================================================
   DetailModal – 시안 이미지 한눈에 + 옵션 + 장바구니
   ================================================================ */
const DetailModal: React.FC<{
    item: CatalogItem; onClose: () => void;
    onAdd: (draftLabel: string, size: string, paper: string, qty: number, opts: string[]) => void;
    isAdmin: boolean;
    onUpload: (itemId: string, draftId: string, imgIdx: 0 | 1, file: File) => void;
    onDelete: (itemId: string, draftId: string, imgIdx: 0 | 1) => void;
}> = ({ item, onClose, onAdd, isAdmin, onUpload, onDelete }) => {
    const [selDraft, setSelDraft] = useState<Draft | null>(null);
    const [viewerDraft, setViewerDraft] = useState<{ d: Draft, i: number } | null>(null);
    const [viewImg, setViewImg] = useState<string | null>(null);
    const [size, setSize] = useState(getSizes(item.id)[0]);
    const [paper, setPaper] = useState(getPapers(item.id)[0]);
    const [qty, setQty] = useState(getMinQty(item.id));
    const [opts, setOpts] = useState<string[]>([]);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const BADGE_OPTS = ['자석타입(2구)', '자석타입(3구)', '모서리 라운딩'];
    const pill = 'flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all';
    const pillOn = 'bg-[#5B3E31] text-white border-[#5B3E31]';
    const pillOff = 'bg-white text-stone-500 border-stone-200';

    return (
        <div className="fixed inset-0 z-50 bg-[#EAECE9] flex flex-col"
            style={{ animation: 'slideUp .32s cubic-bezier(.34,1.56,.64,1)', maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-3 pb-2 bg-white border-b border-stone-100">
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-90 transition-transform"><X size={16} /></button>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[7px] font-black bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {CATEGORIES.find(c => c.items.some(it => it.id === item.id))?.title.split(' ')[0]}
                        </span>
                        <h2 className="text-sm font-black text-stone-900 truncate">{item.id}</h2>
                    </div>
                    <p className="text-[9px] text-stone-500 truncate font-medium">{item.desc}</p>
                </div>
                <div className="w-8 h-8 bg-[#5B3E31]/10 rounded-lg flex items-center justify-center text-[#5B3E31] flex-shrink-0">
                    {React.cloneElement(item.icon as React.ReactElement, { size: 16, strokeWidth: 1.5 })}
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-grow overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* 시안 썸네일 — 가로 3개 한 줄로 */}
                <div className="px-4 pt-3 pb-2">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">시안 선택 <span className="normal-case font-semibold text-stone-300">(탭하여 선택)</span></p>
                    <div className="grid grid-cols-3 gap-2">
                        {item.drafts.map((draft, idx) => (
                            <div key={draft.id} className="flex flex-col gap-1">
                                <button
                                    onClick={() => setViewerDraft({ d: draft, i: idx })}
                                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${selDraft?.id === draft.id ? 'border-[#5B3E31] shadow-md' : 'border-stone-100'}`}
                                    style={{ aspectRatio: '4/3' }}>
                                    {draft.imageUrls[0] ? (
                                        <img src={draft.imageUrls[0]} className="w-full h-full object-cover" alt={draft.label} />
                                    ) : (
                                        <div className="w-full h-full bg-stone-50 flex items-center justify-center">
                                            <FileText size={16} strokeWidth={1} className="text-stone-300" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white leading-none">시안{idx + 1}</span>
                                            <span className="text-[6px] text-white/60 font-medium">크게보기</span>
                                        </div>
                                        {selDraft?.id === draft.id && <div className="w-4 h-4 bg-[#5B3E31] rounded-full flex items-center justify-center"><Check size={9} className="text-white" /></div>}
                                    </div>
                                    {draft.imageUrls[1] && <span className="absolute top-1 right-1 bg-black/50 text-white text-[7px] font-bold px-1 py-0.5 rounded-full leading-none">2면</span>}
                                </button>
                                {/* Admin upload mini buttons */}
                                {isAdmin && (
                                    <div className="flex gap-1 justify-center">
                                        {([0, 1] as const).map(imgIdx => (
                                            <div key={imgIdx}>
                                                <input type="file" accept="image/*" ref={el => { fileRefs.current[`${draft.id}_${imgIdx}`] = el; }} className="hidden"
                                                    onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(item.id, draft.id, imgIdx, f); e.target.value = ''; }} />
                                                <button onClick={() => fileRefs.current[`${draft.id}_${imgIdx}`]?.click()}
                                                    className={`transition-all text-[8px] font-black px-2 py-1 rounded-lg border shadow-sm ${draft.imageUrls[imgIdx] ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-stone-400 bg-white border-stone-200'}`}>
                                                    {imgIdx === 0 ? 'FRONT' : 'BACK'}
                                                </button>
                                                {draft.imageUrls[imgIdx] && (
                                                    <button onClick={() => onDelete(item.id, draft.id, imgIdx)} className="ml-1 text-[10px] text-red-400 hover:text-red-600 transition-colors">✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* selected draft indicator (Simple) */}
                {selDraft && (
                    <div className="mx-4 mb-2 p-3 bg-[#5B3E31]/5 rounded-xl border border-[#5B3E31]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white">
                                <img src={selDraft.imageUrls[0] || ''} className="w-full h-full object-cover" alt="Selected" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#5B3E31]">{selDraft.label} 선택됨</p>
                                <p className="text-[8px] text-stone-400 font-medium">다른 시안을 보려면 썸네일을 클릭하세요</p>
                            </div>
                        </div>
                        <button onClick={() => setViewerDraft({ d: selDraft, i: item.drafts.findIndex(d => d.id === selDraft.id) })}
                            className="text-[9px] font-bold text-[#5B3E31] px-2 py-1 bg-white rounded-lg border border-[#5B3E31]/20">다시보기</button>
                    </div>
                )}

                <div className="mx-4 h-px bg-stone-200 my-2" />

                {/* 옵션 영역 — 모든 선택을 드롭다운으로 통일 */}
                <div className="px-4 py-2 space-y-4">
                    {/* Size Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block ml-1">Size</label>
                        <div className="relative">
                            <select value={size} onChange={e => setSize(e.target.value)}
                                className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                {getSizes(item.id).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><ChevronDown size={14} className="text-stone-400" /></div>
                        </div>
                    </div>

                    {/* Paper/Type Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block ml-1">{item.id === '명찰' ? 'Type' : 'Paper'}</label>
                        <div className="relative">
                            <select value={paper} onChange={e => setPaper(e.target.value)}
                                className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                {getPapers(item.id).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><ChevronDown size={14} className="text-stone-400" /></div>
                        </div>
                    </div>

                    {/* Options Selection (Conditional) */}
                    {(item.id === '명함' || item.id === '명찰' || item.id === '접수증' || item.id === '쇼핑백' || item.id === '편지봉투') && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block ml-1">Optional</label>
                            <div className="relative">
                                {item.id === '명함' ? (
                                    <select value={opts.length === 2 ? '무광 + 둥근모서리' : opts[0] ?? '없음'}
                                        onChange={e => { const v = e.target.value; if (v === '없음') setOpts([]); else if (v === '무광 + 둥근모서리') setOpts(['무광', '둥근모서리']); else setOpts([v]); }}
                                        className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                        {['없음', '무광', '둥근모서리', '무광 + 둥근모서리'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : item.id === '명찰' ? (
                                    <select value={opts[0] ?? '없음'}
                                        onChange={e => { const v = e.target.value; setOpts(v === '없음' ? [] : [v]); }}
                                        className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                        {['없음', ...BADGE_OPTS].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : item.id === '접수증' ? (
                                    <select value={opts[0] ?? '없음'} onChange={e => { const v = e.target.value; setOpts(v === '없음' ? [] : [v]); }}
                                        className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                        {['없음', '메모지만'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : item.id === '쇼핑백' ? (
                                    <select value={opts[0] ?? '없음'} onChange={e => { const v = e.target.value; setOpts(v === '없음' ? [] : [v]); }}
                                        className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                        {['없음', '무광'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    /* 편지봉투 */
                                    <select value={opts[0] ?? '없음'} onChange={e => { const v = e.target.value; setOpts(v === '없음' ? [] : [v]); }}
                                        className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                        {['없음', '자켓형'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                )}
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><ChevronDown size={14} className="text-stone-400" /></div>
                            </div>
                        </div>
                    )}

                    {/* Quantity Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block ml-1">Quantity</label>
                        <div className="relative">
                            <select value={qty} onChange={e => setQty(Number(e.target.value))}
                                className="w-full appearance-none bg-white border border-stone-200 text-stone-800 text-xs font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] shadow-sm">
                                {getQtyOptions(item.id).map(n => {
                                    const unit = (item.id === '종이컵' || item.id === '명함' || item.id === '명찰' || item.id === '배너' || item.id === '포스터') ? '개' : '매';
                                    return <option key={n} value={n}>{n === 0 ? '없음' : n.toLocaleString() + unit}</option>;
                                })}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center"><ChevronDown size={14} className="text-stone-400" /></div>
                        </div>
                    </div>
                </div>
                <div className="h-20" />
            </div>

            {/* Bottom CTA */}
            <div className="flex-shrink-0 px-4 pb-8 pt-3 bg-white border-t border-stone-100">
                <button onClick={() => { if (!selDraft) return; onAdd(selDraft.label, size, paper, qty, opts); onClose(); }}
                    disabled={!selDraft}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${selDraft ? 'bg-[#5B3E31] text-white active:scale-[0.98]' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}>
                    <Check size={16} />{selDraft ? `${selDraft.label} — 장바구니 담기` : '시안을 먼저 선택해주세요'}
                </button>
            </div>

            {/* 이미지 확대 보기 */}
            {viewImg && (
                <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImg(null)}>
                    <button className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"><X size={20} /></button>
                    <img src={viewImg} className="max-w-full max-h-full object-contain rounded-xl" alt="확대 보기" />
                </div>
            )}

            {/* 시안 전용 팝업 뷰어 */}
            {viewerDraft && (
                <DraftViewerModal
                    draft={viewerDraft.d}
                    idx={viewerDraft.i}
                    onClose={() => setViewerDraft(null)}
                    onSelect={() => setSelDraft(viewerDraft.d)}
                />
            )}
        </div>
    );
};

/* ================================================================
   CartModal
   ================================================================ */
const CartModal: React.FC<{ cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; onEstimate: () => void }> = ({ cart, onClose, onRemove, onEstimate }) => (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col" style={{ animation: 'slideUp .3s cubic-bezier(.34,1.56,.64,1)', maxWidth: 480, margin: '0 auto' }}>
        <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-3 pb-3 border-b border-stone-100">
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-90 transition-transform"><X size={18} /></button>
            <div><h2 className="text-base font-black text-stone-900">장바구니</h2><p className="text-[10px] text-stone-400">선택하신 디자인 솔루션</p></div>
        </div>
        <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-30"><ShoppingBasket size={48} strokeWidth={1} className="mb-3" /><p className="text-sm font-bold">비어있습니다.</p></div>
            ) : cart.map(ci => (
                <div key={ci.cartId} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-3">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-[#5B3E31] flex-shrink-0 border border-stone-200">
                        {React.cloneElement(ci.icon as React.ReactElement, { size: 20, strokeWidth: 1.5 })}
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-black text-sm text-stone-900">{ci.name}</span>
                            <span className="text-[9px] font-black text-[#5B3E31] bg-[#5B3E31]/8 px-1.5 py-0.5 rounded">{ci.draftLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-100 font-bold">{ci.size}</span>
                            <span className="text-[9px] text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-100 font-bold">{ci.quantity.toLocaleString()}개</span>
                            {ci.options.length > 0 && <span className="text-[9px] text-[#5B3E31] bg-[#5B3E31]/5 px-1.5 py-0.5 rounded border border-[#5B3E31]/15 font-bold">{ci.options.join(', ')}</span>}
                        </div>
                    </div>
                    <button onClick={() => onRemove(ci.cartId)} className="p-2 text-stone-300 flex-shrink-0"><Trash2 size={16} /></button>
                </div>
            ))}
        </div>
        {cart.length > 0 && (
            <div className="flex-shrink-0 px-4 pb-8 pt-3 bg-white border-t border-stone-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-stone-500">{cart.length}개 품목</span>
                    <span className="text-lg font-black text-[#5B3E31]">{cart.reduce((s, ci) => s + ci.quantity, 0).toLocaleString()}개</span>
                </div>
                <button onClick={onEstimate} className="w-full bg-[#5B3E31] text-white py-4 rounded-2xl font-black text-sm tracking-wide active:scale-[0.98] transition-all">견적 문의하기</button>
            </div>
        )}
    </div>
);

/* ================================================================
   SendModal
   ================================================================ */
const SendModal: React.FC<{ cart: CartItem[]; sendState: SendState; errorMsg: string; onClose: () => void; onSend: (n: string, p: string, e: string, m: string) => void }> = ({ cart, sendState, errorMsg, onClose, onSend }) => {
    const [name, setN] = useState(''); const [phone, setP] = useState(''); const [email, setE] = useState(''); const [memo, setM] = useState('');
    const inp = "w-full bg-stone-50 border border-stone-200 text-stone-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#5B3E31] placeholder:text-stone-300";
    return (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col" style={{ animation: 'slideUp .3s cubic-bezier(.34,1.56,.64,1)', maxWidth: 480, margin: '0 auto' }}>
            <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-3 pb-3 border-b border-stone-100">
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-90 transition-transform"><X size={18} /></button>
                <div><h2 className="text-base font-black text-stone-900">견적 문의</h2><p className="text-[10px] text-stone-400">{cart.length}개 품목</p></div>
            </div>
            <div className="flex-grow overflow-y-auto px-4 py-5 space-y-4">
                {sendState === 'success' ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"><Check size={32} className="text-emerald-600" /></div>
                        <p className="text-lg font-black text-stone-900">견적 문의 완료!</p>
                        <p className="text-sm text-stone-500">담당자가 확인 후 연락드리겠습니다.</p>
                    </div>
                ) : (<>
                    <div><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">이름 *</label><input type="text" value={name} onChange={e => setN(e.target.value)} placeholder="성함" className={inp} /></div>
                    <div><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">연락처 *</label><input type="tel" value={phone} onChange={e => setP(e.target.value)} placeholder="010-0000-0000" className={inp} /></div>
                    <div><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">이메일 (선택)</label><input type="email" value={email} onChange={e => setE(e.target.value)} placeholder="example@email.com" className={inp} /></div>
                    <div><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">메모 (선택)</label><textarea value={memo} onChange={e => setM(e.target.value)} placeholder="추가 요청사항" rows={3} className={`${inp} resize-none`} /></div>
                    {errorMsg && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs text-red-600 font-semibold">{errorMsg}</p></div>}
                </>)}
            </div>
            {sendState !== 'success' && (
                <div className="flex-shrink-0 px-4 pb-8 pt-3 bg-white border-t border-stone-100">
                    <button onClick={() => onSend(name, phone, email, memo)} disabled={sendState === 'sending'}
                        className="w-full py-4 bg-[#5B3E31] text-white rounded-2xl font-black text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-60">
                        {sendState === 'sending' ? '발송 중...' : '견적 문의 전송'}
                    </button>
                </div>
            )}
        </div>
    );
};

/* ================================================================
   Main App
   ================================================================ */
export default function App() {
    const [categories, setCategories] = useState<Category[]>(() =>
        CATEGORIES.map(c => ({ ...c, items: c.items.map(it => ({ ...it, drafts: mkDrafts() })) }))
    );
    const [currentPage, setCurrentPage] = useState(0);
    const [selCat, setSelCat] = useState<Category | null>(null);
    const [selItem, setSelItem] = useState<CatalogItem | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [sendState, setSendState] = useState<SendState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPwShow, setAdminPwShow] = useState(false);
    const [adminPw, setAdminPw] = useState('');
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const totalPages = CATEGORIES.length + 2; // cover + categories + back cover

    // Socket.io
    useEffect(() => {
        const s = io(SERVER, { transports: ['websocket', 'polling'] });
        fetch(`${SERVER}/api/images`).then(r => r.json()).then((meta: Record<string, Record<string, (string | null)[]>>) => {
            setCategories(prev => prev.map(cat => ({
                ...cat, items: cat.items.map(it => {
                    const m = meta[it.id]; if (!m) return it;
                    return { ...it, drafts: it.drafts.map(d => { const u = m[d.id]; if (!u) return d; return { ...d, imageUrls: [u[0] ?? null, u[1] ?? null] as [string | null, string | null] }; }) };
                })
            })));
        }).catch(() => { });
        s.on('imageUpdated', ({ itemId, draftId, imageUrls }: { itemId: string; draftId: string; imageUrls: [string | null, string | null] }) => {
            setCategories(prev => prev.map(cat => ({ ...cat, items: cat.items.map(it => it.id !== itemId ? it : { ...it, drafts: it.drafts.map(d => d.id !== draftId ? d : { ...d, imageUrls }) }) })));
        });
        return () => { s.disconnect(); };
    }, []);

    const resolvedItem = selItem ? categories.flatMap(c => c.items).find(it => it.id === selItem.id) ?? null : null;

    const handleUpload = useCallback(async (itemId: string, draftId: string, imgIdx: 0 | 1, file: File) => {
        const fd = new FormData();
        fd.append('itemId', itemId);
        fd.append('draftId', draftId);
        fd.append('imageIndex', String(imgIdx));
        fd.append('image', file);
        await fetch(`${SERVER}/api/upload`, { method: 'POST', body: fd });
    }, []);
    const handleDelete = useCallback(async (itemId: string, draftId: string, imgIdx: 0 | 1) => {
        await fetch(`${SERVER}/api/images/${itemId}/${draftId}/${imgIdx}`, { method: 'DELETE' });
    }, []);

    const goNext = useCallback(() => { if (!selCat && !selItem && !showCart) setCurrentPage(p => (p + 1) % totalPages); }, [selCat, selItem, showCart, totalPages]);
    const goPrev = useCallback(() => { if (!selCat && !selItem && !showCart) setCurrentPage(p => (p - 1 + totalPages) % totalPages); }, [selCat, selItem, showCart, totalPages]);
    const onTS = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
    const onTM = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
    const onTE = () => {
        if (!touchStartX.current || !touchEndX.current || selCat || selItem || showCart) return;
        const d = touchStartX.current - touchEndX.current;
        if (d > 50) goNext(); else if (d < -50) goPrev();
        touchStartX.current = null; touchEndX.current = null;
    };

    function addToCart(dl: string, sz: string, pp: string, qt: number, op: string[]) {
        if (!resolvedItem) return;
        setCart(p => [...p, { cartId: `${Date.now()}-${Math.random()}`, id: resolvedItem.id, name: resolvedItem.id, draftLabel: dl, size: sz, paper: pp, quantity: qt, options: op, icon: resolvedItem.icon }]);
        setSelItem(null); setSelCat(null);
    }
    async function handleSend(n: string, p: string, e: string, m: string) {
        if (!n.trim() || !p.trim()) { setErrorMsg('이름과 연락처를 입력해주세요.'); return; }
        setSendState('sending'); setErrorMsg('');
        try {
            const r = await fetch(`${SERVER}/api/send-estimate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderName: n, senderPhone: p, senderEmail: e, memo: m, items: cart.map(ci => ({ name: ci.name, draftLabel: ci.draftLabel, size: ci.size, paper: ci.paper, quantity: ci.quantity, options: ci.options })) }) });
            const d = await r.json(); if (!r.ok) throw new Error(d.error || '발송 실패');
            setSendState('success'); setCart([]);
            setTimeout(() => { setSendState('idle'); setShowCart(false); }, 2500);
        } catch (err: unknown) { setSendState('error'); setErrorMsg(err instanceof Error ? err.message : '오류'); }
    }

    return (
        <div className="h-[100dvh] flex flex-col bg-[#EAECE9] overflow-hidden"
            style={{ fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", maxWidth: 480, margin: '0 auto' }}>
            <style>{`
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes blob{0%{transform:scale(1);opacity:.4}100%{transform:scale(1.1);opacity:.6}}
        .animate-blob{animation:blob 10s infinite alternate ease-in-out}
        .delay-2{animation-delay:3s}
        body{-webkit-font-smoothing:antialiased;word-break:keep-all;background:#EAECE9;overscroll-behavior:none;touch-action:pan-y}
        ::-webkit-scrollbar{display:none}
      `}</style>

            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                <div className="active:scale-95 transition-transform cursor-pointer" onClick={() => { setCurrentPage(0); setSelCat(null); setSelItem(null); }}>
                    <BrandLogo size="sm" />
                </div>
                <div className="flex items-center gap-2">
                    {/* Page nav dots */}
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur px-2 py-1.5 rounded-full border border-stone-200 shadow-sm">
                        <button onClick={goPrev} className="p-0.5 text-stone-400 active:text-[#5B3E31]"><ChevronLeft size={14} /></button>
                        <div className="flex gap-1 items-center">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i)}
                                    className={`h-1 rounded-full transition-all duration-300 ${currentPage === i ? 'bg-[#5B3E31] w-4' : 'bg-stone-300 w-1.5'}`} />
                            ))}
                        </div>
                        <button onClick={goNext} className="p-0.5 text-stone-400 active:text-[#5B3E31]"><ChevronRight size={14} /></button>
                    </div>
                    {/* Cart */}
                    <button onClick={() => setShowCart(true)} className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-stone-600 border border-stone-200 shadow-sm active:scale-90 transition-transform">
                        <ShoppingBag size={18} />
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#5B3E31] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">{cart.length}</span>}
                    </button>
                </div>
            </header>

            {/* Main catalog area */}
            <main className="flex-grow relative mx-3 mb-3" onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
                <div className="h-full bg-[#F5F5F3] rounded-[2rem] shadow-xl overflow-hidden border border-white flex flex-col">
                    {currentPage === 0 ? (
                        /* ── Cover ── */
                        <div className="h-full flex flex-col items-center justify-between py-10 px-6 text-center relative overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none opacity-40">
                                <div className="absolute top-1/4 left-0 w-60 h-60 bg-[#D2C8BA] rounded-full blur-[80px] animate-blob" />
                                <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-[#C6CCD2] rounded-full blur-[80px] animate-blob delay-2" />
                            </div>
                            <div className="z-10 mt-8"><BrandLogo size="lg" /></div>
                            <div className="z-10 flex flex-col items-center w-full">
                                <p className="text-[9px] tracking-[0.5em] font-bold text-[#5B3E31]/40 uppercase mb-6">Premium Brand Identity</p>
                                <h3 className="text-[15px] font-medium text-[#5B3E31] leading-[1.8] px-4">
                                    우리 병원이란 브랜드가 고객에게 닿는 첫 순간,<br />
                                    <span className="font-bold">같이n가치</span>가 그 경험의 품격을 디자인합니다.
                                </h3>
                            </div>
                            <div className="z-10 mb-2 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-[1px] bg-stone-300" /><span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Solution Portfolio</span><div className="w-6 h-[1px] bg-stone-300" />
                                </div>
                                <p className="text-[8px] text-stone-300 font-bold uppercase">Designed by 같이n가치 creative team</p>
                            </div>
                        </div>
                    ) : currentPage === totalPages - 1 ? (
                        /* ── Back Cover ── */
                        <div className="h-full flex flex-col items-center justify-center py-12 px-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none opacity-30"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#D2C8BA] rounded-full blur-[100px] animate-blob" /></div>
                            <div className="z-10 opacity-80 mb-10"><BrandLogo size="md" /></div>
                            <div className="z-10 flex flex-col items-center gap-2">
                                <div className="w-6 h-[1px] bg-[#5B3E31]/20 mb-4" />
                                <p className="text-sm font-medium text-[#5B3E31] tracking-tight mb-1">Premium Brand Identity</p>
                                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em]">Designed by 같이n가치 creative team</p>
                                <div className="w-6 h-[1px] bg-[#5B3E31]/20 mt-4" />
                            </div>
                        </div>
                    ) : (
                        /* ── Category Page ── */
                        <div className="h-full flex flex-col p-5">
                            <header className="mb-5 flex-shrink-0">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2.5 py-0.5 bg-white border border-stone-200 text-[#5B3E31] text-[8px] font-black rounded-full uppercase tracking-widest">CH. 0{currentPage}</span>
                                    <div className="h-[1px] flex-grow bg-stone-200/50" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-0.5 tracking-tight">{CATEGORIES[currentPage - 1].title}</h3>
                                <p className="text-stone-400 text-xs font-medium">{CATEGORIES[currentPage - 1].subtitle}</p>
                            </header>
                            <div className="flex-grow grid grid-cols-2 gap-3 overflow-y-auto content-start" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {CATEGORIES[currentPage - 1].items.map((it, idx) => (
                                    <button key={idx}
                                        onClick={() => setSelItem(it)}
                                        className="flex flex-col items-center p-4 bg-white border border-stone-100 rounded-[1.5rem] shadow-sm active:scale-95 active:bg-stone-50 transition-all"
                                        style={{ animation: `fadeScale .25s ease ${idx * 50}ms both` }}>
                                        <div className="w-12 h-12 bg-stone-50 text-[#5B3E31] rounded-2xl flex items-center justify-center mb-2 border border-stone-100 shadow-inner">
                                            {React.cloneElement(it.icon as React.ReactElement, { size: 22, strokeWidth: 1.2 })}
                                        </div>
                                        <h4 className="text-xs font-bold text-stone-800 mb-1">{it.id}</h4>
                                        <p className="text-[9px] text-stone-400 font-medium text-center leading-tight line-clamp-2">{it.desc}</p>
                                    </button>
                                ))}
                            </div>
                            <footer className="mt-3 pt-3 flex justify-between items-center border-t border-stone-100 flex-shrink-0">
                                <span className="text-[7px] text-stone-400 font-bold uppercase tracking-[0.4em]">같이n가치 premium solution</span>
                                <div className="text-2xl font-black text-stone-200 tabular-nums leading-none">0{currentPage}</div>
                            </footer>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center flex-shrink-0 pb-2 relative px-4">
                <div className="absolute right-4 bottom-2">
                    {isAdmin ? (
                        <button onClick={() => setIsAdmin(false)} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#5B3E31] text-white shadow-sm ring-1 ring-white/20 active:scale-95 transition-all"><Lock size={10} strokeWidth={2.5} /> Admin active</button>
                    ) : adminPwShow ? (
                        <div className="flex items-center gap-1 group">
                            <input type="password" value={adminPw} autoFocus placeholder="PIN" onChange={e => setAdminPw(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && adminPw === '1234') { setIsAdmin(true); setAdminPwShow(false); setAdminPw(''); } if (e.key === 'Escape') { setAdminPwShow(false); setAdminPw(''); } }}
                                className="w-16 text-xs bg-white border border-stone-200 px-2 py-1.5 rounded-lg shadow-inner focus:outline-none focus:border-[#5B3E31]" />
                            <button onClick={() => { if (adminPw === '1234') { setIsAdmin(true); setAdminPwShow(false); setAdminPw(''); } }}
                                className="text-[8px] font-black px-2.5 py-1.5 bg-[#5B3E31] text-white rounded-lg shadow-sm active:scale-90 transition-transform">GO</button>
                        </div>
                    ) : (
                        <button onClick={() => setAdminPwShow(true)} className="p-2 text-stone-300 hover:text-stone-500 hover:bg-white/50 rounded-full transition-all active:scale-90"><Settings size={18} strokeWidth={1.5} /></button>
                    )}
                </div>
                <p className="text-stone-400 text-[8px] font-bold tracking-[0.5em] uppercase mb-0.5">Medical Branding Architecture</p>
                <p className="text-stone-300 text-[7px] opacity-60">© 2024 Gati-n-Gachi. Premium Space Solutions.</p>
            </footer>

            {/* ── Popups ── */}
            {selCat && !selItem && (
                <CategoryPopup cat={selCat} onClose={() => setSelCat(null)} onSelectItem={it => setSelItem(it)}
                    liveItems={categories.flatMap(c => c.items)} />
            )}
            {resolvedItem && (
                <DetailModal item={resolvedItem} onClose={() => { setSelItem(null); setSelCat(null); }} onAdd={addToCart}
                    isAdmin={isAdmin} onUpload={handleUpload} onDelete={handleDelete} />
            )}
            {showCart && (
                <CartModal cart={cart} onClose={() => setShowCart(false)} onRemove={id => setCart(p => p.filter(c => c.cartId !== id))} onEstimate={() => setSendState('form')} />
            )}
            {(sendState === 'form' || sendState === 'sending' || sendState === 'success' || sendState === 'error') && (
                <SendModal cart={cart} sendState={sendState} errorMsg={errorMsg}
                    onClose={() => { setSendState('idle'); setErrorMsg(''); }} onSend={handleSend} />
            )}
        </div>
    );
}
