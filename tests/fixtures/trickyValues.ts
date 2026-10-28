/** Values that break naive quoting in one shell or another. */
export const TRICKY_VALUES: { name: string; value: string }[] = [
  { name: 'plain', value: 'status -sb' },
  { name: 'single', value: "commit -m 'it''s fine'" },
  { name: 'double', value: 'log --pretty=format:"%h %s"' },
  { name: 'backslash', value: '!echo C:\\Users\\dev' },
  { name: 'dollar', value: '!echo $HOME and ${PATH}' },
  { name: 'backtick', value: '!echo `date`' },
  { name: 'percent', value: 'log --pretty=format:%h%%' },
  { name: 'semicolon', value: '!git fetch; git status' },
  { name: 'hash', value: '!echo #notacomment' },
  { name: 'func', value: '!f() { git checkout -b "$1" && git push -u origin "$1"; }; f' },
  // Empty quotes and a non-ASCII bar: the case that broke in Windows PowerShell 5.1.
  { name: 'activity', value: `!git log --format="%ad" | awk '{printf "%s ", $1; printf "▇"; print ""}'` },
  { name: 'trailingbs', value: '!echo "C:\\temp\\"' },
];
