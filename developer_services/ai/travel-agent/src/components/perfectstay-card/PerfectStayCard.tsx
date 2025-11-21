import { Star, MapPin, Tag as TagIcon, AirplaneTilt } from "@phosphor-icons/react";

interface PerfectStayProduct {
  id: string;
  name: string;
  destination: string;
  price: string;
  priceValue: number;
  flightIncluded: boolean;
  tags: string[];
  tagsSummary: string;
  stars: number;
  rating: number;
  reviews: number;
  url: string;
  image: string;
  relevanceScore: number;
}

interface PerfectStayCardProps {
  product: PerfectStayProduct;
}

export function PerfectStayCard({ product }: PerfectStayCardProps) {
  return (
    <div className="group relative bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
      {/* Image Section */}
      {product.image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Relevance Score Badge */}
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {product.relevanceScore}% match
          </div>
          
          {/* Flight Badge */}
          {product.flightIncluded && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
              <AirplaneTilt size={14} weight="fill" />
              Vol inclus
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* Stars */}
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              size={16}
              weight={i < product.stars ? "fill" : "regular"}
              className={i < product.stars ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {product.rating > 0 && (
              <>
                {product.rating.toFixed(1)}/5 • {product.reviews} avis
              </>
            )}
          </span>
        </div>

        {/* Hotel Name */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        {/* Destination */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
          <MapPin size={16} weight="fill" />
          <span className="text-sm">{product.destination}</span>
        </div>

        {/* Tags Section - EMPHASIZED */}
        {product.tags && product.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TagIcon size={16} weight="fill" className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Caractéristiques
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price Section - PROMINENT */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              À partir de
            </p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {product.price}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              par personne
            </p>
          </div>

          {/* CTA Button */}
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Voir l'offre
          </a>
        </div>
      </div>
    </div>
  );
}

export function PerfectStayResults({ products }: { products: PerfectStayProduct[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucun résultat trouvé
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🏨 Nos meilleures offres pour vous
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {products.length} résultat{products.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <PerfectStayCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
