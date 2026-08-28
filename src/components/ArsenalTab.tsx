import React, { useState } from "react";
import { Shield, Plus, Trash2, Search, Check, Sparkles, Sliders } from "lucide-react";
import type { Ball, UserProfile } from "../types";

interface ArsenalTabProps {
  balls: Ball[];
  user: UserProfile;
  onAddBall: (ballData: Partial<Ball>) => Promise<void>;
  onDeleteBall: (id: string) => Promise<void>;
}

export const ArsenalTab: React.FC<ArsenalTabProps> = ({
  balls,
  user,
  onAddBall,
  onDeleteBall,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Storm");
  const [weight, setWeight] = useState("15");
  const [coverstock, setCoverstock] = useState("Solid Reactive");
  const [core, setCore] = useState("Symmetric");
  const [surface, setSurface] = useState("2000 Abralon");
  const [drillingLayout, setDrillingLayout] = useState("50 x 4.5 x 35");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetCatalog = [
    { brand: "Storm", model: "Phaze II", coverstock: "TX-16 Solid", core: "Velocity", surface: "3000 Abralon" },
    { brand: "Storm", model: "Hy-Road", coverstock: "R2S Solid", core: "Inverted Fe²", surface: "1500 Polish" },
    { brand: "Storm", model: "Summit Peak", coverstock: "TX-23 Pearl", core: "Centripetal HD", surface: "Reacta Gloss" },
    { brand: "Storm", model: "Proton Physix", coverstock: "NeX Solid", core: "Atomic Core", surface: "2000 Abralon" },
    { brand: "Hammer", model: "Black Widow 3.0", coverstock: "Gas Mask Solid", core: "Gas Mask Asym", surface: "500/1000/1500" },
    { brand: "Hammer", model: "Black Widow 2.0 Ghost", coverstock: "Aggression Pearl", core: "Gas Mask Asym", surface: "Factory Polish" },
    { brand: "Hammer", model: "Scandal S", coverstock: "Semtex Hybrid", core: "Scandal Core", surface: "2000 Abralon" },
    { brand: "Motiv", model: "Jackal Ghost", coverstock: "Coercion MXHC Hybrid", core: "Predator V2", surface: "2000 LSS" },
    { brand: "Motiv", model: "Venom Shock", coverstock: "Turmoil Solid", core: "Gear Symmetric", surface: "4000 Grit" },
    { brand: "Motiv", model: "Forge Fire", coverstock: "Coercion HVX Solid", core: "Forge Asym", surface: "4000 LSS" },
    { brand: "Roto Grip", model: "Gem", coverstock: "MicroTrax Solid", core: "Defiant LRG Asym", surface: "2000 Abralon" },
    { brand: "Roto Grip", model: "Hustle RIP", coverstock: "VTC Solid", core: "Hustle Sym", surface: "3000 Abralon" },
    { brand: "Brunswick", model: "Quantum EVO", coverstock: "EVO Hybrid", core: "Quantum Mushroom", surface: "2000 Abralon" },
    { brand: "900 Global", model: "Zen", coverstock: "S77R Pearl", core: "Meditate Symmetric", surface: "Factory Finish" },
    { brand: "Columbia 300", model: "White Dot Spare", coverstock: "Polyester / Plastic", core: "Bullet Core", surface: "High Gloss" },
  ];

  const filteredCatalog = presetCatalog.filter(
    (b) =>
      b.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.model.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.coverstock.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const handleSelectPreset = (p: typeof presetCatalog[0]) => {
    setBrand(p.brand);
    setName(p.model);
    setCoverstock(p.coverstock);
    setCore(p.core);
    setSurface(p.surface);
  };

  const handleCreateBall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddBall({
        name: name.trim(),
        brand,
        weight: Number(weight) || 15,
        coverstock,
        core,
        surface,
        drillingLayout: drillingLayout.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive: true,
      });
      setName("");
      setNotes("");
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="arsenal-tab-content" className="space-y-6">
      {/* Banner */}
      <div className="bg-[#1a1a16] text-white rounded-3xl p-5 sm:p-7 border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#9fe870] text-black text-[10px] font-extrabold uppercase rounded tracking-wider">
                BALL ARSENAL
              </span>
              <span className="text-xs text-stone-400">Equipment & Layout Locker</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide uppercase text-white">
              MY BOWLING BAG ({balls.length})
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1">
              Track your ball specifications, surface preps, drilling layouts, and pin-to-PAP coordinates for optimal lane transitions.
            </p>
          </div>

          <button
            id="add-ball-cta-btn"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#9fe870] hover:bg-[#8fd860] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Ball to Arsenal
          </button>
        </div>
      </div>

      {/* Balls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balls.map((b) => (
          <div
            key={b.id}
            id={`ball-card-${b.id}`}
            className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    {b.brand}
                  </span>
                  <h3 className="font-display text-2xl font-black text-stone-900 uppercase leading-tight">
                    {b.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-black bg-stone-900 text-[#9fe870] rounded-xl">
                  {b.weight} LBS
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 my-3 bg-stone-50 p-3 rounded-2xl border border-stone-100 text-[11px] text-stone-700">
                <div>
                  <span className="text-stone-400 font-bold block text-[9px] uppercase">COVERSTOCK</span>
                  <span className="font-semibold">{b.coverstock || "Solid Reactive"}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block text-[9px] uppercase">CORE</span>
                  <span className="font-semibold">{b.core || "Symmetric"}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block text-[9px] uppercase">SURFACE FINISH</span>
                  <span className="font-semibold">{b.surface || "2000 Abralon"}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block text-[9px] uppercase">DRILLING LAYOUT</span>
                  <span className="font-semibold">{b.drillingLayout || "50 x 4.5 x 35"}</span>
                </div>
              </div>

              {b.notes && (
                <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-xl border border-stone-100">
                  "{b.notes}"
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                Active in Bag
              </span>
              <button
                onClick={() => onDeleteBall(b.id)}
                className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Remove from arsenal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Ball Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider">
                  ARSENAL LOCKER
                </span>
                <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
                  ADD BOWLING BALL
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Preset Catalog Quick Select */}
            <div className="my-3 space-y-2">
              <label className="text-xs font-extrabold text-stone-700 uppercase flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                Select from Pro Ball Catalog:
              </label>
              <input
                type="text"
                placeholder="Search Storm, Hammer, Motiv, Brunswick..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
              />

              <div className="max-h-36 overflow-y-auto divide-y divide-stone-100 bg-stone-50 rounded-xl border border-stone-200 p-1">
                {filteredCatalog.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(item)}
                    className="w-full text-left p-2 hover:bg-stone-200/80 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-stone-900">{item.brand} {item.model}</strong>
                      <span className="text-[10px] text-stone-500 block">{item.coverstock} • {item.core}</span>
                    </div>
                    <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      Use Preset
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Ball Form */}
            <form onSubmit={handleCreateBall} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phaze II"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Weight (lbs)</label>
                  <select
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    {["12", "13", "14", "15", "16"].map((w) => (
                      <option key={w} value={w}>{w} lbs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Coverstock</label>
                  <input
                    type="text"
                    value={coverstock}
                    onChange={(e) => setCoverstock(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Core Type</label>
                  <input
                    type="text"
                    value={core}
                    onChange={(e) => setCore(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Surface Finish</label>
                  <input
                    type="text"
                    value={surface}
                    onChange={(e) => setSurface(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Drilling Layout</label>
                <input
                  type="text"
                  placeholder="e.g. 50 x 4.5 x 35"
                  value={drillingLayout}
                  onChange={(e) => setDrillingLayout(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Notes / Ball Motion</label>
                <input
                  type="text"
                  placeholder="e.g. Benchmark ball for house shots, reads midlane early"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-add-ball-btn"
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="px-5 py-2 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isSubmitting ? "Adding..." : "Add to Arsenal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
