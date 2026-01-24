// src/admin/places/AddPlaceFull.tsx
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  GeoPoint,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, authReady, db, storage } from "../../auth/firebase";
import { SITES_META, type VenueSport } from "../../data/sitesMeta";
import PlacePreview from "../../componenets/admin/places/PlacePreview";
import BrandingFields from "../../componenets/admin/places/BrandingFields";
import VisualsFields from "../../componenets/admin/places/VisualsFields";
import { Section } from "../../componenets/common/Section";
import { Button } from "../../componenets/common/Button";
import BasicDetailsFields from "../../componenets/admin/places/BasicDetailsFields";
import CategoryZoneFields from "../../componenets/admin/places/CategoryZoneFields";
import { CATEGORIES } from "../../componenets/place-list/place-list-utils";
import { ALL_SPORT_OPTIONS } from "../../data/sports";

/* ---------------------------------------------
   Types & constants
--------------------------------------------- */
type Zone = { id: string; name: string; color: string; categoryId: string };

export const DEFAULT_COMP_ZONES = [
  { name: "Dakar", color: "#E91E63" },
  { name: "Diamniadio", color: "#12B76A" },
  { name: "Saly", color: "#FF8C00" },
  { name: "Olympic Village", color: "#ffe100" },
];

/* ---------------------------------------------
   Main component
--------------------------------------------- */
export default function AddPlaceFull() {
  // data loads
  const [categoryId, setCategoryId] = useState("competition");

  // we keep primary zones (for the current category) and fallback zones (Competition)
  const [zonesPrimary, setZonesPrimary] = useState<Zone[]>([]);
  const [zonesFallback, setZonesFallback] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [zonesLoading, setZonesLoading] = useState(false);

  // base fields
  const [name, setName] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [address, setAddress] = useState("");
  const [info, setInfo] = useState("");
  const [infoFr, setInfoFr] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [tags, setTags] = useState<string>("");

  // visuals/meta
  const [pointColor, setPointColor] = useState("#2962FF");
  const [gradientFrom, setGradientFrom] = useState("#12B76A");
  const [gradientTo, setGradientTo] = useState("#0A6B4A");
  const [brandTitle, setBrandTitle] = useState("DAKAR 2026");
  const [brandSubtitle, setBrandSubtitle] = useState("YOUTH OLYMPIC GAMES");
  const [locationLabel, setLocationLabel] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [website, setWebsite] = useState("");
  const [socialHandle, setSocialHandle] = useState("");

  // image upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);

  // UX state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);

  // competition-only
  const [sports, setSports] = useState<VenueSport[]>([]);
  const [sportsTouched, setSportsTouched] = useState(false);

  /* ---------------------------------------------
     Zones: fetch helpers + seeding
  --------------------------------------------- */
  async function fetchZonesByCategory(cid: string): Promise<Zone[]> {
    const snap = await getDocs(
      query(collection(db, "zones"), where("categoryId", "==", cid)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Zone[];
  }

  async function seedDefaultZonesIfEmpty() {
    // only seed defaults under Competition
    const list = await fetchZonesByCategory("competition");
    if (list.length > 0) return;
    const batch = writeBatch(db);
    const colRef = collection(db, "zones");
    const ts = serverTimestamp();
    for (const z of DEFAULT_COMP_ZONES) {
      const refDoc = doc(colRef);
      batch.set(refDoc, {
        name: z.name,
        color: z.color,
        categoryId: "competition",
        createdAt: ts,
        updatedAt: ts,
      });
    }
    await batch.commit();
  }

  async function loadZonesForCategory(cid: string) {
    setZonesLoading(true);
    try {
      // always try to load zones for the selected category
      const primary = await fetchZonesByCategory(cid);

      // if none exist AND cid is not competition, provide competition zones as fallback
      let fallback: Zone[] = [];
      if (primary.length === 0 && cid !== "competition") {
        await seedDefaultZonesIfEmpty();
        fallback = await fetchZonesByCategory("competition");
      }

      setZonesPrimary(primary);
      setZonesFallback(fallback);

      // keep selection if still valid; otherwise default to ""
      setZoneId((prev) => {
        const combined = [...primary, ...fallback];
        return combined.some((z) => z.id === prev) ? prev : "";
      });
    } catch (e) {
      console.error("Failed to load zones:", e);
      setZonesPrimary([]);
      setZonesFallback([]);
      setZoneId("");
    } finally {
      setZonesLoading(false);
    }
  }

  /* ---------------------------------------------
     Sports options (from SITES_META)
  --------------------------------------------- */
  function uniqSports(list: VenueSport[]): VenueSport[] {
    const seen = new Set<string>();
    const out: VenueSport[] = [];
    for (const s of list) {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        out.push(s);
      }
    }
    return out;
  }

  // auto-load sports only for competition category
  useEffect(() => {
    if (categoryId !== "competition") return;
    if (sportsTouched) return;
    if (!name.trim()) return;

    const combinedZones = [...zonesPrimary, ...zonesFallback];
    const zoneName = combinedZones.find((z) => z.id === zoneId)?.name;
    if (!zoneName) return;

    const metaForZone = (SITES_META as Record<string, any>)[zoneName];
    if (!metaForZone) return;

    const n = name.trim().toLowerCase();
    const matchedKey = Object.keys(metaForZone).find(
      (k) => k.toLowerCase() === n,
    );
    if (!matchedKey) return;

    const m = metaForZone[matchedKey] as { sports?: VenueSport[] };
    if (m?.sports?.length && sports.length === 0) {
      setSports(m.sports);
    }
  }, [
    categoryId,
    zoneId,
    zonesPrimary,
    zonesFallback,
    name,
    sports.length,
    sportsTouched,
  ]);

  // load zones whenever category changes
  useEffect(() => {
    void loadZonesForCategory(categoryId);
  }, [categoryId]);

  // preview URL
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canSave = !!name && lat !== "" && lng !== "" && !saving;

  // const gradientStyle = useMemo(
  //   () => ({
  //     background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
  //   }),
  //   [gradientFrom, gradientTo],
  // );

  async function uploadImage(zone: string, placeName: string) {
    if (!file) return null;

    // ✅ Ensure auth is ready and user exists before uploading
    await authReady;
    if (!auth.currentUser) {
      throw new Error("Not signed in – cannot upload");
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeName = placeName.trim().toLowerCase().replace(/\s+/g, "-");
    const folder = zone || categoryId || "unassigned";
    const path = `places/${folder}/${Date.now()}-${safeName}.${ext}`;

    // ✅ Guarantee a valid contentType
    const guess =
      file.type ||
      (ext === "png"
        ? "image/png"
        : ["jpg", "jpeg"].includes(ext)
        ? "image/jpeg"
        : ext === "webp"
        ? "image/webp"
        : "application/octet-stream");

    const storageRef = ref(storage, path);

    return new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: guess,
      });
      task.on(
        "state_changed",
        (snap) =>
          setUploadPct(
            Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
          ),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  }

  function placesCollectionRef(zid: string) {
    return zid
      ? collection(db, "zones", zid, "places")
      : collection(db, "places");
  }

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    setToast(null);
    try {
      const imageUrl = await uploadImage(zoneId, name);
      const colRef = placesCollectionRef(zoneId);
      const docRef = await addDoc(colRef, {
        name,
        name_fr: nameFr || null,
        location: new GeoPoint(Number(lat), Number(lng)),
        address: address || null,
        info: info || null,
        info_fr: infoFr || null,
        rating: rating === "" ? null : Number(rating),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        pointColor: pointColor || null,
        imageUrl: imageUrl || null,
        brandTitle: brandTitle || null,
        brandSubtitle: brandSubtitle || null,
        locationLabel: locationLabel || null,
        shortCode: shortCode || null,
        gradientFrom: gradientFrom || null,
        gradientTo: gradientTo || null,
        website: website || null,
        socialHandle: socialHandle || null,
        sports: categoryId === "competition" ? sports : null,
        sportCount: categoryId === "competition" ? sports.length : 0,

        // helpful refs
        categoryId,
        zoneId: zoneId || null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setToast({ kind: "success", msg: "Place created 🎉" });
      console.info("Place created:", docRef.id);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // reset form
      setName("");
      setNameFr("");
      setLat("");
      setLng("");
      setAddress("");
      setInfo("");
      setInfoFr("");
      setRating("");
      setTags("");
      setPointColor("#2962FF");
      setGradientFrom("#12B76A");
      setGradientTo("#0A6B4A");
      setBrandTitle("DAKAR 2026");
      setBrandSubtitle("YOUTH OLYMPIC GAMES");
      setLocationLabel("");
      setShortCode("");
      setWebsite("");
      setSocialHandle("");
      setFile(null);
      setPreview(null);
      setUploadPct(0);
      setSports([]);
      setSportsTouched(false);
    } catch (e) {
      console.error(e);
      setToast({
        kind: "error",
        msg: "Failed to create place. Check your permissions/rules and try again.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  const hasFallback = zonesPrimary.length === 0 && zonesFallback.length > 0;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add a Place</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create a new venue with coordinates, visuals, and branding. All
            fields are stored as Firestore fields.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            toast.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Form column - left */}
        <div className="lg:col-span-8 space-y-1 pr-8 border-r border-gray-200">
          {/* Category & Zone */}
          <Section
            title="Location & Zone"
            desc="Pick the category and zone where this place belongs."
          >
            <CategoryZoneFields
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              CATEGORIES={CATEGORIES}
              zonesLoading={zonesLoading}
              hasFallback={hasFallback}
              zoneId={zoneId}
              setZoneId={setZoneId}
              zonesPrimary={zonesPrimary}
              zonesFallback={zonesFallback}
            />
          </Section>

          {/* Basic */}
          <BasicDetailsFields
            name={name}
            setName={setName}
            nameFr={nameFr}
            setNameFr={setNameFr}
            lat={lat}
            setLat={setLat}
            lng={lng}
            setLng={setLng}
            address={address}
            setAddress={setAddress}
            info={info}
            setInfo={setInfo}
            infoFr={infoFr}
            setInfoFr={setInfoFr}
            rating={rating}
            setRating={setRating}
            tags={tags}
            setTags={setTags}
            tagList={tagList}
            pointColor={pointColor}
            setPointColor={setPointColor}
            categoryId={categoryId}
            ALL_SPORT_OPTIONS={ALL_SPORT_OPTIONS}
            sports={sports}
            setSports={setSports}
            sportsTouched={sportsTouched}
            setSportsTouched={setSportsTouched}
            uniqSports={uniqSports}
          />

          {/* Visuals */}
          <Section
            title="Visuals & Media"
            desc="Gradient and cover image for the venue card."
          >
            <VisualsFields
              gradientFrom={gradientFrom}
              setGradientFrom={setGradientFrom}
              gradientTo={gradientTo}
              setGradientTo={setGradientTo}
              file={file}
              setFile={setFile}
              uploadPct={uploadPct}
              preview={preview}
            />
          </Section>

          {/* Branding */}
          <Section title="Branding & Links">
            <BrandingFields
              brandTitle={brandTitle}
              setBrandTitle={setBrandTitle}
              brandSubtitle={brandSubtitle}
              setBrandSubtitle={setBrandSubtitle}
              locationLabel={locationLabel}
              setLocationLabel={setLocationLabel}
              shortCode={shortCode}
              setShortCode={setShortCode}
              website={website}
              setWebsite={setWebsite}
              socialHandle={socialHandle}
              setSocialHandle={setSocialHandle}
            />
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onSave} disabled={!canSave}>
              {saving ? "Saving…" : "Create place"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setName("");
                setNameFr("");
                setLat("");
                setLng("");
                setAddress("");
                setInfo("");
                setRating("");
                setTags("");
                setPointColor("#2962FF");
                setGradientFrom("#12B76A");
                setGradientTo("#0A6B4A");
                setBrandTitle("DAKAR 2026");
                setBrandSubtitle("YOUTH OLYMPIC GAMES");
                setLocationLabel("");
                setShortCode("");
                setWebsite("");
                setSocialHandle("");
                setFile(null);
                setPreview(null);
                setUploadPct(0);
                setSports([]);
                setSportsTouched(false);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Live preview column - right */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 self-start">
          <section className="">
            <header className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Live preview
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                How this card might look in the app.
              </p>
            </header>
            <div className="space-y-4">
              <PlacePreview
                gradientFrom={gradientFrom}
                gradientTo={gradientTo}
                preview={preview}
                brandTitle={brandTitle}
                brandSubtitle={brandSubtitle}
                locationLabel={locationLabel}
                shortCode={shortCode}
                name={name}
                nameFr={nameFr}
                info={info}
                infoFr={infoFr}
                address={address}
                categoryId={categoryId}
                sports={sports}
                tagList={tagList}
                website={website}
                socialHandle={socialHandle}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
