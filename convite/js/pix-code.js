/* Inspeção local do formato PIX BR Code (não consulta bancos nem confirma pagamento). */
(() => {
  'use strict';
  const readAscii = (bytes, start, length) => String.fromCharCode(...bytes.slice(start,start+length));
  function checksum(bytes) {
    let crc = 0xffff;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let i = 0; i < 8; i++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  function inspect(input) {
    const value=String(input??'').trim();
    if (!value) return {empty:true, valid:false, amount:null, message:'Pendente: código não preenchido.'};
    const bytes=new TextEncoder().encode(value);
    if (bytes.length < 40 || bytes.length > 1500 || !value.startsWith('000201'))
      return {empty:false, valid:false, amount:null, message:'Este texto não parece ser um código PIX copia e cola completo (BR Code).'};
    let offset=0, amount=null, hasFormat=false, hasCRC=false;
    while (offset < bytes.length) {
      if (offset+4 > bytes.length) return {empty:false,valid:false,amount:null,message:'Código PIX incompleto ou malformado.'};
      const tag=readAscii(bytes,offset,2);
      const lengthText=readAscii(bytes,offset+2,2);
      if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText))
        return {empty:false,valid:false,amount:null,message:'Formato de campo PIX inválido.'};
      const length=Number(lengthText), start=offset+4;
      if (start+length>bytes.length) return {empty:false,valid:false,amount:null,message:'Código PIX truncado.'};
      if (tag==='00') hasFormat=readAscii(bytes,start,length)==='01';
      if (tag==='54') {
        const str=readAscii(bytes,start,length);
        if (!/^\d+(?:\.\d{1,2})?$/.test(str)) return {empty:false,valid:false,amount:null,message:'Valor incorreto no campo PIX.'};
        amount=Math.round(Number(str)*100)/100;
      }
      if (tag==='63') {
        if (length!==4 || start+length!==bytes.length) return {empty:false,valid:false,amount:null,message:'Campo de verificação PIX inválido.'};
        const supplied=readAscii(bytes,start,length).toUpperCase();
        const expected=checksum(bytes.slice(0,start));
        if (supplied!==expected) return {empty:false,valid:false,amount:null,message:'Código PIX com verificação (CRC) incorreta. Gere-o novamente no banco.'};
        hasCRC=true;
      }
      offset=start+length;
    }
    if (!hasFormat || !hasCRC) return {empty:false,valid:false,amount:null,message:'Código PIX sem identificação ou verificação obrigatória.'};
    return {empty:false,valid:true,amount,message: amount===null?'Valor não detectado; confirme no aplicativo do banco.':'Valor identificado no código.'};
  }
  window.PixCodeUtils={inspect};
})();
