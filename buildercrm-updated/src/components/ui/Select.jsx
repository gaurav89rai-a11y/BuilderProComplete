import { inp } from "./Input";

export function Select({value,onChange,options,placeholder}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{...inp,cursor:"pointer"}}>
      {placeholder&&<option value="">{placeholder}</option>}
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  );
}
