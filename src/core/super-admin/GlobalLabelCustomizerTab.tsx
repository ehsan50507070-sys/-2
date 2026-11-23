// Tab 2: Global Label & Terminology Customizer + School Branding Controls (Phase 8A Super Admin Governance)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ImagePlus,
  RotateCcw,
  Save,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { toPersianDigits } from '../../lib/digits';
import { useAppearance } from '../appearance/AppearanceContext';
import { useSchoolData } from '../data/DataContext';
import {
  buildFullLabelCatalog,
  compressImageFileToDataUrl,
  type GlobalLabelCategory,
} from './superAdminHelpers';

const CATEGORY_TABS: Array<{ id: GlobalLabelCategory | 'all'; labelFa: string }> = [
  { id: 'all', labelFa: 'همه برچسب‌ها' },
  { id: 'identity', labelFa: 'هویت سامانه' },
  { id: 'menus', labelFa: 'عناوین منوها و بسته‌ها' },
  { id: 'terminology', labelFa: 'واژگان کلیدی سامانه' },
];

export const GlobalLabelCustomizerTab: React.FC = () => {
  const {
    allManifests,
    globalSystemConfig,
    updateGlobalLabels,
    resetGlobalLabels,
    activeSchool,
    schoolBrandingConfig,
    saveSchoolBrandingConfig,
    updateSchoolUnit,
  } = useSchoolData();
  const { schoolLogoUrl, refreshSchoolLogo } = useAppearance();

  const catalog = useMemo(() => buildFullLabelCatalog(allManifests), [allManifests]);

  const [draftLabels, setDraftLabels] = useState<Record<string, string>>(
    () => ({ ...(globalSystemConfig?.labels ?? {}) })
  );
  const [category, setCategory] = useState<GlobalLabelCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);

  // School letterhead/branding fields migrated cleanly from removed site-user-settings page
  const [schoolDisplayName, setSchoolDisplayName] = useState(
    schoolBrandingConfig?.schoolDisplayName ?? activeSchool?.name ?? ''
  );
  const [printSubtitle, setPrintSubtitle] = useState(
    schoolBrandingConfig?.printSubtitle ?? activeSchool?.letterheadSubtitle ?? ''
  );

  useEffect(() => {
    setDraftLabels({ ...(globalSystemConfig?.labels ?? {}) });
  }, [globalSystemConfig?.labels]);

  useEffect(() => {
    setSchoolDisplayName(schoolBrandingConfig?.schoolDisplayName ?? activeSchool?.name ?? '');
    setPrintSubtitle(schoolBrandingConfig?.printSubtitle ?? activeSchool?.letterheadSubtitle ?? '');
  }, [schoolBrandingConfig, activeSchool]);

  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const currentVal = (draftLabels[item.key] ?? '').toLowerCase();
      return (
        item.labelFa.toLowerCase().includes(q) ||
        item.defaultValue.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        currentVal.includes(q)
      );
    });
  }, [catalog, category, searchQuery, draftLabels]);

  const modifiedCount = useMemo(() => {
    return Object.entries(draftLabels).filter(([, v]) => v && v.trim().length > 0).length;
  }, [draftLabels]);

  const handleSaveLabels = () => {
    const res = updateGlobalLabels(draftLabels);
    if (res.ok) {
      setFeedback('تمامی عناوین، منوها و واژگان سراسری ذخیره شدند و در کل سامانه اعمال گردیدند.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetAll = () => {
    const res = resetGlobalLabels();
    if (res.ok) {
      setDraftLabels({});
      setFeedback('تمام نام‌ها و واژگان کلیدی به مقادیر پیشفرض بازگردانی شدند.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSchool) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, { maxWidth: 512, quality: 0.8 });
      if (!compressed.ok || !compressed.dataUrl) {
        setLogoStatus(compressed.errorFa ?? 'خطا در پردازش تصویر لوگو.');
        return;
      }
      await updateSchoolUnit({ ...activeSchool, logoDataUrl: compressed.dataUrl });
      refreshSchoolLogo();
      setLogoStatus(
        `لوگوی «${activeSchool.name}» با موفقیت فشرده‌سازی (${toPersianDigits(compressed.sizeKb ?? 1)} کیلوبایت) و ذخیره شد.`
      );
      setTimeout(() => setLogoStatus(null), 4000);
    } catch (err) {
      setLogoStatus(err instanceof Error ? err.message : 'خطا در پردازش تصویر لوگو.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!activeSchool) return;
    await updateSchoolUnit({ ...activeSchool, logoDataUrl: undefined });
    refreshSchoolLogo();
    setLogoStatus('لوگوی اختصاصی مدرسه فعال حذف شد.');
    setTimeout(() => setLogoStatus(null), 3000);
  };

  const handleSaveSchoolBranding = async () => {
    if (!activeSchool) return;
    await saveSchoolBrandingConfig({
      id: `${activeSchool.id}:branding`,
      schoolId: activeSchool.id,
      appTitle: draftLabels['site.name'] || schoolBrandingConfig?.appTitle || '',
      schoolDisplayName: schoolDisplayName.trim(),
      printSubtitle: printSubtitle.trim(),
      logoMediaId: schoolBrandingConfig?.logoMediaId,
      sectionLabels: schoolBrandingConfig?.sectionLabels ?? {},
      updatedByName: 'راهبر ارشد سامانه',
      updatedAt: new Date().toISOString(),
    });
    setLogoStatus('مشخصات سربرگ چاپی و نام نمایشی مدرسه فعال ذخیره شد.');
    setTimeout(() => setLogoStatus(null), 3500);
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Global Labels & Terminology Editor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 brand-text" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                سفارشی‌سازی نام‌ها، منوها و واژگان سراسری سامانه
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                هر تغییر بلافاصله در منوی کناری، هدر، صفحه ورود، کارت‌ها و سربرگ‌های چاپ اعمال می‌شود ({toPersianDigits(modifiedCount)} برچسب سفارشی فعال).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>بازگردانی تمام نام‌ها به پیشفرض</span>
            </button>
            <button
              type="button"
              data-testid="save-global-labels-btn"
              onClick={handleSaveLabels}
              className="brand-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5" />
              <span>ذخیره تغییرات واژگان</span>
            </button>
          </div>
        </div>

        {/* Category Tabs + Search */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  category === tab.id
                    ? 'brand-btn'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.labelFa}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی برچسب یا واژه..."
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-3 text-xs text-slate-900 focus:border-[var(--brand-primary)] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Label Rows */}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {filteredItems.map((item) => {
            const currentVal = draftLabels[item.key] ?? '';
            const isCustomized = currentVal.trim().length > 0 && currentVal.trim() !== item.defaultValue;
            return (
              <div
                key={item.key}
                className={`rounded-xl border p-3 transition-colors ${
                  isCustomized
                    ? 'border-[var(--brand-primary)] bg-slate-50/70 dark:bg-slate-800/60'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor={`lbl-${item.key}`}
                    className="text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {item.labelFa}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    پیشفرض: {item.defaultValue}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id={`lbl-${item.key}`}
                    data-label-input={item.key}
                    type="text"
                    value={currentVal}
                    placeholder={item.defaultValue}
                    onChange={(e) =>
                      setDraftLabels((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-[var(--brand-primary)] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {currentVal.trim().length > 0 && (
                    <button
                      type="button"
                      title="بازنشانی این مورد به پیشفرض"
                      onClick={() =>
                        setDraftLabels((prev) => {
                          const next = { ...prev };
                          delete next[item.key];
                          return next;
                        })
                      }
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Migrated School Logo & Letterhead Branding Section */}
      {activeSchool && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 brand-text" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  لوگو و سربرگ چاپی مدرسه فعال ({activeSchool.name})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  در تمام چاپ‌های A4 و A5 و هدر منوی کناری نمایش داده می‌شود.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveSchoolBranding}
              className="brand-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5" />
              <span>ذخیره سربرگ مدرسه</span>
            </button>
          </div>

          {logoStatus && (
            <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
              {logoStatus}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {schoolLogoUrl ? (
                  <img
                    src={schoolLogoUrl}
                    alt={activeSchool.name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>بارگذاری لوگوی مدرسه</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {schoolLogoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline dark:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>حذف لوگو</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                نام نمایشی مدرسه در سربرگ
              </label>
              <input
                type="text"
                value={schoolDisplayName}
                onChange={(e) => setSchoolDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                زیرعنوان رسمی برگه‌های چاپی
              </label>
              <input
                type="text"
                value={printSubtitle}
                onChange={(e) => setPrintSubtitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
