import { MapPin, Star, ExternalLink, Scissors } from "lucide-react";
import { motion } from "framer-motion";

type Salon = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  address: string;
  distance: string;
  image: string;
  specialties: string[];
};

const mockSalons: Salon[] = [
  {
    id: "1",
    name: "Salon New York 5",
    rating: 4.9,
    reviews: 128,
    address: "123 Broadway, New York, NY",
    distance: "0.8 miles",
    image: "https://images.unsplash.com/photo-1521590832167-7bfc170cc3be?q=80&w=800&auto=format&fit=crop",
    specialties: ["Balayage", "Vivid Colors", "Precision Cuts"]
  },
  {
    id: "2",
    name: "The Velvet Room",
    rating: 4.7,
    reviews: 84,
    address: "456 5th Ave, New York, NY",
    distance: "1.2 miles",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
    specialties: ["Textured Hair", "Extensions"]
  },
  {
    id: "3",
    name: "Aura Studio",
    rating: 4.8,
    reviews: 215,
    address: "789 Park Ave, New York, NY",
    distance: "2.5 miles",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
    specialties: ["Bridal styling", "Keratin prep"]
  }
];

export default function SalonList() {
  return (
    <section className="mt-16 rounded-[2.5rem] border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-950/20 to-slate-900/40 p-8 md:p-12 shadow-2xl shadow-fuchsia-900/20">
      <div className="mb-10 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white mb-2 flex items-center gap-3">
            <Scissors className="h-6 w-6 text-fuchsia-400" />
            Matched Salons
          </h2>
          <p className="text-slate-400 max-w-lg">
            We found these premium salons near you that specialize in your recommended styles. Data powered by n8n workflow.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {mockSalons.map((salon, i) => (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
            key={salon.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 hover:bg-slate-900/80 transition-colors"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img 
                src={salon.image} 
                alt={salon.name}
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium text-white">{salon.name}</h3>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-medium text-white">{salon.rating}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {salon.distance} • {salon.address}
                </p>
                <p className="text-xs text-slate-500">
                  {salon.reviews} verified reviews
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {salon.specialties.map(spec => (
                  <span key={spec} className="text-[10px] uppercase tracking-wider font-medium bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 px-2 py-1 rounded-full">
                    {spec}
                  </span>
                ))}
              </div>

              <button className="w-full py-2.5 rounded-xl bg-white text-slate-950 font-medium text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                Book Consultation <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
