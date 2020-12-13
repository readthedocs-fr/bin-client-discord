{
  function inlineCode(c?: string) {
  	const content = c ?? ""
    return {
      type: "code",
      raw: `\`${content}\``,
      lang: "",
      content,
      inline: true,
    };
  }
}
start = (code / inline_code / blankline / t: $(!code !inline_code $[^\n])+ n: blankline?  {
  return { type: "text", content: `${t}${n ? '\n' : ''}` }
})+


code = "```" l: lang? c: code_content? "```" blankline? {
  const content = c ?? ""
  const isBlank = c.trim() === ""
  const lang = (l?.[0] ?? "").trim()
  const node = {
  	type: "code",
    raw: `\`\`\`${`${lang}\n${content}`.trim()}\n\`\`\`\n`,
    lang,
  	content: isBlank ? lang : content,
    inline: false,
  };
  return isBlank && node.lang === "" ? { type: "text", content: node.raw } : node
}

lang = chars "\n"


code_content
  = $(no_back_chars "`" code_content)
  / $(no_back_chars "``" code_content)
  / $no_back_chars

inline_code
  = "`" c: $no_back_chars "`" blankline? { return inlineCode(c) }
  / "``" c: inline_code_content "``" blankline? { return inlineCode(c) }

inline_code_content
  = $(no_back_chars "`" code_content)
  / $no_back_chars


text = t:chars blankline?  {
  return t;
}
blankline = [\n] {
  return { type: "blank" };
}
chars = $[^\n]+
no_back_chars = $[^`]+
