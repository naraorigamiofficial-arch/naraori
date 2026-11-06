import { requireAdmin } from "@/lib/auth";
import { getCatalogueSafe } from "@/lib/store";
import { setPublished, updateOption } from "../actions";

export default async function CataloguePage() {
  await requireAdmin();
  const cat = await getCatalogueSafe();
  return (
    <>
      <h1 className="title-2">Catalogue &amp; prices</h1>
      <p className="muted">Changes apply to the public shop within a few minutes. Past order requests keep the price they were made at.</p>
      {cat.products.map((p) => (
        <section key={p.slug} className="studio-product">
          <header>
            <h2 className="title-3">{p.name}</h2>
            <form action={setPublished}>
              <input type="hidden" name="slug" value={p.slug} />
              <input type="hidden" name="published" value={String(!p.published)} />
              <span className="tag">{p.published ? "Visible in shop" : "Hidden"}</span>{" "}
              <button className="btn btn-quiet" type="submit">{p.published ? "Hide" : "Show"}</button>
            </form>
          </header>
          {p.options.map((o) => (
            <form key={o.sku} action={updateOption} className="studio-option">
              <input type="hidden" name="sku" value={o.sku} />
              <span><b>{o.label}</b><br /><span className="mono">{o.sku}</span></span>
              <label>Price ₹<input name="price" type="number" step="0.01" min="0" className="input" defaultValue={o.unitPrice / 100} disabled={p.pricing === "enquiry"} /></label>
              {p.pricing === "enquiry" && <input type="hidden" name="price" value="0" />}
              <label>Min<input name="minUnits" type="number" min="1" className="input" defaultValue={o.minUnits} /></label>
              <label>Max<input name="maxUnits" type="number" min="1" className="input" defaultValue={o.maxUnits} /></label>
              <label>Availability
                <select name="availability" className="select" defaultValue={o.availability}>
                  <option value="made_to_order">Made to order</option>
                  <option value="in_stock">In stock</option>
                  <option value="by_enquiry">By enquiry</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <button className="btn" type="submit">Save</button>
            </form>
          ))}
        </section>
      ))}
    </>
  );
}
