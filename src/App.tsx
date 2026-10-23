import { FormEvent, ReactNode, useState } from "react"

type FormData = {
  deliveryPartner: string
  packageType: string
  vehicleType: string
  deliveryMode: string
  region: string
  weatherCondition: string
  distance: string
  packageWeight: string
}

type Prediction = {
  hours: number;
  minutes: number;
  status?: string;
};
type IconName = "arrow" | "box" | "brain" | "check" | "clock" | "cloud" | "info" | "location" | "menu" | "route" | "scale" | "shield" | "sparkles" | "truck" | "x"

const initialForm: FormData = {
  deliveryPartner: "",
  packageType: "",
  vehicleType: "",
  deliveryMode: "",
  region: "",
  weatherCondition: "",
  distance: "",
  packageWeight: "",
}

const options = {
  deliveryPartner: ["DHL", "FedEx", "UPS", "Blue Dart", "Delhivery"],
  packageType: ["Document", "Parcel", "Fragile", "Perishable", "Oversized"],
  vehicleType: ["Motorcycle", "Van", "Truck", "Electric vehicle"],
  deliveryMode: ["Standard", "Express", "Same day", "Economy"],
  region: ["Urban", "Suburban", "Rural", "Remote"],
  weatherCondition: ["Clear", "Rainy", "Cloudy", "Foggy", "Stormy"],
}

const fieldLabels: Record<keyof FormData, string> = {
  deliveryPartner: "Delivery Partner",
  packageType: "Package Type",
  vehicleType: "Vehicle Type",
  deliveryMode: "Delivery Mode",
  region: "Region",
  weatherCondition: "Weather Condition",
  distance: "Distance",
  packageWeight: "Package Weight",
}

const API_URL = import.meta.env.VITE_PREDICTION_API_URL || "/api/predict"

function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    box: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="m3 8 9 5 9-5M12 13v9M21 8v10l-9 5-9-5V8" />
      </>
    ),
    brain: (
      <>
        <path d="M9.5 4.5A3 3 0 0 0 6 7.4 3.5 3.5 0 0 0 5 14a3 3 0 0 0 3.5 4.5A2.5 2.5 0 0 0 12 20V5.5a2.5 2.5 0 0 0-2.5-1Z" />
        <path d="M14.5 4.5A3 3 0 0 1 18 7.4a3.5 3.5 0 0 1 1 6.6 3 3 0 0 1-3.5 4.5A2.5 2.5 0 0 1 12 20V5.5a2.5 2.5 0 0 1 2.5-1ZM8 10h1m6 0h1M8.5 15H10m4 0h1.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    cloud: (
      <path d="M17.5 19H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 11 4 4 0 0 1 17.5 19Z" />
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    route: (
      <>
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="6" r="2" />
        <path d="M7 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h1" />
      </>
    ),
    scale: <path d="M12 4v16M5 7h14M8 7l-4 7h8L8 7Zm8 0-4 7h8l-4-7Z" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sparkles: (
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Zm6 10 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    ),
    truck: (
      <>
        <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <a
      className="flex items-center gap-3"
      href="#home"
      aria-label="ShipTime AI home"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
        <Icon name="truck" className="size-5" />
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${
          inverted ? "selected-logo-wordmark" : "text-slate-950"
        }`}
      >
        {inverted ? (
          "LOGISTIC SHIPMENT"
        ) : (
          <>
            ShipTime <span className="text-blue-600">AI</span>
          </>
        )}
      </span>
    </a>
  )
}

function SelectField({
  id,
  label,
  value,
  values,
  icon,
  onChange,
}: {
  id: keyof FormData
  label: string
  value: string
  values: string[]
  icon: IconName
  onChange: (value: string) => void
}) {
  return (
    <label className="field-group" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <Icon name={icon} className="field-icon" />
        <select
          id={id}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            Select {label.toLowerCase()}
          </option>
          {values.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  suffix,
  icon,
  onChange,
}: {
  id: "distance" | "packageWeight"
  label: string
  value: string
  placeholder: string
  suffix: string
  icon: IconName
  onChange: (value: string) => void
}) {
  return (
    <label className="field-group" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="field-shell">
        <Icon name={icon} className="field-icon" />
        <input
          id={id}
          min="0.1"
          placeholder={placeholder}
          required
          step="0.1"
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="field-suffix">{suffix}</span>
      </span>
    </label>
  )
}

function getPrediction(data: unknown): Prediction {
  const response = data as Record<string, unknown>
  const totalMinutes =
    typeof response.duration_minutes === "number"
      ? response.duration_minutes
      : typeof response.predicted_duration_minutes === "number"
        ? response.predicted_duration_minutes
        : null
  if (totalMinutes !== null)
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: Math.round(totalMinutes % 60),
      status: typeof response.status === "string" ? response.status : undefined,
    }
  if (typeof response.hours === "number")
    return {
      hours: Math.floor(response.hours),
      minutes:
        typeof response.minutes === "number"
          ? Math.round(response.minutes)
          : Math.round((response.hours % 1) * 60),
      status: typeof response.status === "string" ? response.status : undefined,
    }
  throw new Error("The prediction service returned an unexpected response.")
}

function App() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setError("")
  }

  function resetForm() {
    setForm(initialForm)
    setPrediction(null)
    setError("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setPrediction(null)
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_partner: form.deliveryPartner,
          package_type: form.packageType,
          vehicle_type: form.vehicleType,
          delivery_mode: form.deliveryMode,
          region: form.region,
          weather_condition: form.weatherCondition,
          distance_km: Number(form.distance),
          package_weight_kg: Number(form.packageWeight),
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          payload && typeof payload.message === "string"
            ? payload.message
            : "The prediction service could not process this shipment."
        throw new Error(message)
      }
      setPrediction(getPrediction(payload))
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Unable to reach the prediction service. Please check the backend connection and try again."
          : requestError instanceof Error
            ? requestError.message
            : "Something went wrong while generating the estimate.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="page-shell flex h-18 items-center justify-between">
          <Logo inverted />
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            <a className="nav-link active" href="#home">
              Home
            </a>
            <a className="nav-link" href="#predict">
              Predict Delivery
            </a>
            <a className="nav-link" href="#about">
              About
            </a>
            <a className="nav-link" href="#contact">
              Contact
            </a>
          </nav>
          <a
            className="button button-small hidden md:inline-flex"
            href="#predict"
          >
            Try prediction <Icon name="arrow" className="size-4" />
          </a>
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            type="button"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Icon name={mobileNavOpen ? "x" : "menu"} />
          </button>
        </div>
        {mobileNavOpen && (
          <nav
            className="page-shell flex flex-col gap-1 border-t border-slate-100 py-3 md:hidden"
            aria-label="Mobile navigation"
          >
            {[
              ["Home", "#home"],
              ["Predict Delivery", "#predict"],
              ["About", "#about"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href={href}
                key={href}
                onClick={() => setMobileNavOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="home">
        <section className="relative overflow-hidden bg-white pb-30 pt-18 sm:pt-24">
          <div className="hero-grid" />
          <div className="hero-glow" />
          <div className="page-shell relative text-center">
            <div className="eyebrow mx-auto">
              <Icon name="sparkles" className="size-4" />
              Machine learning powered estimates
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Predict Your Delivery Time{" "}
              <span className="text-blue-600">with AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              Estimate shipment duration using logistics data and machine
              learning. Plan smarter with a clear, data-informed delivery
              window.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-medium text-slate-600">
              {[
                "Eight logistics variables",
                "API-ready workflow",
                "Clear delivery estimate",
              ].map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="page-shell relative -mt-18 pb-24" id="predict">
          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.06] lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="p-6 sm:p-9 lg:p-10">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name="route" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Shipment details
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                    Get your delivery estimate
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter the shipment information used by your prediction
                    model.
                  </p>
                </div>
              </div>
              <form className="mt-8" onSubmit={handleSubmit}>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <SelectField
                    id="deliveryPartner"
                    label="Delivery Partner"
                    value={form.deliveryPartner}
                    values={options.deliveryPartner}
                    icon="truck"
                    onChange={(value) => updateField("deliveryPartner", value)}
                  />
                  <SelectField
                    id="packageType"
                    label="Package Type"
                    value={form.packageType}
                    values={options.packageType}
                    icon="box"
                    onChange={(value) => updateField("packageType", value)}
                  />
                  <SelectField
                    id="vehicleType"
                    label="Vehicle Type"
                    value={form.vehicleType}
                    values={options.vehicleType}
                    icon="truck"
                    onChange={(value) => updateField("vehicleType", value)}
                  />
                  <SelectField
                    id="deliveryMode"
                    label="Delivery Mode"
                    value={form.deliveryMode}
                    values={options.deliveryMode}
                    icon="clock"
                    onChange={(value) => updateField("deliveryMode", value)}
                  />
                  <SelectField
                    id="region"
                    label="Region"
                    value={form.region}
                    values={options.region}
                    icon="location"
                    onChange={(value) => updateField("region", value)}
                  />
                  <SelectField
                    id="weatherCondition"
                    label="Weather Condition"
                    value={form.weatherCondition}
                    values={options.weatherCondition}
                    icon="cloud"
                    onChange={(value) => updateField("weatherCondition", value)}
                  />
                  <NumberField
                    id="distance"
                    label="Distance"
                    value={form.distance}
                    placeholder="e.g. 245"
                    suffix="km"
                    icon="route"
                    onChange={(value) => updateField("distance", value)}
                  />
                  <NumberField
                    id="packageWeight"
                    label="Package Weight"
                    value={form.packageWeight}
                    placeholder="e.g. 3.5"
                    suffix="kg"
                    icon="scale"
                    onChange={(value) => updateField("packageWeight", value)}
                  />
                </div>
                {error && (
                  <div
                    className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    role="alert"
                  >
                    <Icon name="info" className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-bold">Prediction unavailable</p>
                      <p className="mt-1 leading-5 text-red-700">{error}</p>
                    </div>
                  </div>
                )}
                <button
                  className="button mt-7 w-full justify-center py-3.5"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Processing shipment data...
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" />
                      Predict Delivery Time
                      <Icon name="arrow" />
                    </>
                  )}
                </button>
                <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-400">
                  <Icon name="shield" className="size-4" />
                  Your shipment data is sent securely to the configured
                  prediction API.
                </p>
              </form>
            </div>

            <aside className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-9 lg:p-8">
              <div className="absolute -right-20 -top-20 size-52 rounded-full bg-blue-500/15 blur-3xl" />
              {prediction ? (
                <div
                  className="relative flex h-full flex-col"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">
                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                    Prediction complete
                  </div>
                  <p className="mt-7 text-sm text-slate-400">
                    Estimated delivery duration
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <strong className="text-5xl font-bold tracking-tight">
                      {prediction.hours}
                    </strong>
                    <span className="text-sm font-semibold text-slate-300">
                      hr
                    </span>
                    <strong className="ml-2 text-5xl font-bold tracking-tight">
                      {prediction.minutes}
                    </strong>
                    <span className="text-sm font-semibold text-slate-300">
                      min
                    </span>
                  </div>
                  <div className="my-7 h-px bg-white/10" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Shipment summary
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                    {([
                      "deliveryPartner",
                      "deliveryMode",
                      "distance",
                      "packageWeight",
                    ] as const).map((key) => (
                      <div key={key}>
                        <dt className="text-xs text-slate-500">
                          {fieldLabels[key]}
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-200">
                          {form[key]}
                          {key === "distance"
                            ? " km"
                            : key === "packageWeight"
                              ? " kg"
                              : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {prediction.status && (
                    <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                      Status:{" "}
                      <span className="font-bold">{prediction.status}</span>
                    </div>
                  )}
                  <div className="mt-auto pt-8">
                    <p className="flex gap-2 text-xs leading-5 text-slate-400">
                      <Icon name="info" className="mt-0.5 size-4 shrink-0" />
                      This estimate depends on model accuracy and the quality of
                      available data. It is not real-time tracking.
                    </p>
                    <button
                      className="mt-5 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                      type="button"
                      onClick={resetForm}
                    >
                      Start a new prediction
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full min-h-96 flex-col">
                  <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-blue-300">
                    <Icon name="brain" className="size-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold">
                    AI-assisted planning
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Your model uses operational shipment variables to estimate
                    the time between dispatch and delivery.
                  </p>
                  <div className="my-7 h-px bg-white/10" />
                  <div className="space-y-5">
                    {[
                      [
                        "Route context",
                        "Distance, region, and weather conditions",
                        "route",
                      ],
                      [
                        "Transport profile",
                        "Partner, vehicle, and delivery mode",
                        "truck",
                      ],
                      [
                        "Parcel factors",
                        "Package type and total weight",
                        "box",
                      ],
                    ].map(([title, description, icon]) => (
                      <div className="flex gap-3.5" key={title}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300">
                          <Icon name={icon as IconName} className="size-4.5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-8 text-xs font-semibold text-slate-500">
                    <span className="size-2 rounded-full bg-blue-400" />
                    Ready for shipment data
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <section
          className="border-y border-slate-200 bg-white py-22"
          id="about"
        >
          <div className="page-shell">
            <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <div className="eyebrow">
                  <Icon name="brain" className="size-4" />
                  About the model
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Better estimates start with better context.
                </h2>
                <p className="mt-5 leading-7 text-slate-600">
                  Machine learning can identify patterns across historical
                  shipment data that fixed delivery rules may miss. ShipTime AI
                  turns those patterns into an understandable duration estimate.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [
                    "Distance & region",
                    "Route length and destination type establish the shipment’s operating context.",
                    "location",
                  ],
                  [
                    "Vehicle & mode",
                    "Transport capacity and service priority influence expected movement speed.",
                    "truck",
                  ],
                  [
                    "Weather conditions",
                    "Environmental conditions can introduce meaningful variability to a route.",
                    "cloud",
                  ],
                  [
                    "Package details",
                    "Parcel category and weight help represent handling and transport requirements.",
                    "box",
                  ],
                ].map(([title, description, icon], index) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/5"
                    key={title}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                        <Icon name={icon as IconName} />
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400" id="contact">
        <div className="page-shell py-12" />
      </footer>
    </div>
  )
}

export default App
