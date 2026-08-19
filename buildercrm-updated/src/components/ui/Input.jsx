export const inp = {
  background:"var(--raise)",border:"1px solid var(--bord)",color:"var(--txt)",borderRadius:8,padding:"9px 12px",
  fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",
};

export function Input({value,onChange,placeholder,type="text",required}) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} required={required} style={inp}/>;
}
