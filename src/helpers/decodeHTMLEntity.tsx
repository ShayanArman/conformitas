export default function decodeHTMLEntity(inputStr: string) {
  if (typeof inputStr !== "string") return inputStr;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = inputStr;
  return textarea.value;
}
