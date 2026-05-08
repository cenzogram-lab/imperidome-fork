import {
  Briefcase,
  Car,
  Dumbbell,
  Home,
  MapPin,
  Music2,
  RefreshCw,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import EditableText from "./EditableText";

const items = [
  {
    label: "Restaurants",
    labelKey: "who-we-serve.item-1",
    Icon: UtensilsCrossed,
  },
  { label: "Home Services", labelKey: "who-we-serve.item-2", Icon: Wrench },
  {
    label: "Health and Medical",
    labelKey: "who-we-serve.item-3",
    Icon: Stethoscope,
  },
  {
    label: "Fitness and Gyms",
    labelKey: "who-we-serve.item-4",
    Icon: Dumbbell,
  },
  { label: "Salons and Spas", labelKey: "who-we-serve.item-5", Icon: Scissors },
  {
    label: "Retail and Boutiques",
    labelKey: "who-we-serve.item-6",
    Icon: ShoppingBag,
  },
  {
    label: "Professional Services",
    labelKey: "who-we-serve.item-7",
    Icon: Briefcase,
  },
  { label: "Auto and Detailing", labelKey: "who-we-serve.item-8", Icon: Car },
  {
    label: "Subscription Services",
    labelKey: "who-we-serve.item-9",
    Icon: RefreshCw,
  },
  {
    label: "Bars and Entertainment",
    labelKey: "who-we-serve.item-10",
    Icon: Music2,
  },
  { label: "Real Estate", labelKey: "who-we-serve.item-11", Icon: Home },
  {
    label: "Any Local Business",
    labelKey: "who-we-serve.item-12",
    Icon: MapPin,
  },
];

export function WhoWeServeSection() {
  return (
    <section style={{ backgroundColor: "#0A0B14" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-10"
          style={{ color: "#EEF0F8", fontFamily: "Arial, Inter, sans-serif" }}
        >
          <EditableText
            textKey="who-we-serve.heading"
            defaultText="We Build for Real Businesses."
          />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(({ label, labelKey, Icon }) => (
            <div
              key={labelKey}
              className="rounded-xl flex flex-col items-center justify-center py-6 px-3 gap-3"
              style={{
                backgroundColor: "rgba(17,19,34,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid #1C1F33",
              }}
            >
              <Icon size={32} style={{ color: "#5EF08A" }} strokeWidth={1.5} />
              <span
                className="text-sm font-medium text-center"
                style={{
                  color: "#EEF0F8",
                  fontFamily: "Arial, Inter, sans-serif",
                }}
              >
                <EditableText
                  textKey={labelKey}
                  defaultText={label}
                  as="span"
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
