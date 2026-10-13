import React, { useContext } from "react";
import { ShopContext } from "../../Context/ShopContext";
import ProductSection from "../ProductSection/ProductSection";

// Products the visitor opened recently (saved in the browser).
const RecentlyViewed = ({ excludeId }) => {
  const { recentlyViewed, products } = useContext(ShopContext);
  const items = recentlyViewed
    .filter((id) => id !== excludeId)
    .map((id) => products[id])
    .filter(Boolean)
    .slice(0, 4);

  if (items.length === 0) return null;
  return (
    <ProductSection
      title="Recently Viewed"
      subtitle="Pick up where you left off"
      products={items}
      loading={false}
    />
  );
};
export default RecentlyViewed;
