function getDutchVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find(v => v.lang === 'nl-NL') ||
    voices.find(v => v.lang.startsWith('nl')) ||
    null
  );
}

export function useVoice() {
  function speak(text, lang = 'nl-NL') {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = getDutchVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return { speak };
}
