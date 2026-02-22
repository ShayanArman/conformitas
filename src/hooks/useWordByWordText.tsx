import { areTwoStringArraysTheSame } from '@server/util/helpers/randomStuffHelpers';
import { useState, useEffect, useRef } from 'react';

export function useWordByWordText({
  text,
  opened,
  wordDelay,
  finalDelay,
  onComplete
}: {text: string[], wordDelay: number, finalDelay?: number, opened: boolean, onComplete?: () => void}) {
  const [textToShow, setTextToShow] = useState<string[]>(text);
  const [visibleText, setVisibleText] = useState("");
  const showIndexRef = useRef({ sentenceIndex: 0, wordIndex: 0 });

  useEffect(() => {
    if (!areTwoStringArraysTheSame(textToShow, text)) {
      setTextToShow(text);
      setVisibleText("");
      showIndexRef.current = { sentenceIndex: 0, wordIndex: 0 }; // Reset index
    }
  }, [text]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const displayWords = () => {
      const { sentenceIndex, wordIndex } = showIndexRef.current;

      if (sentenceIndex < textToShow.length) {
        const words = textToShow[sentenceIndex]?.split(" ");
        if (words && wordIndex < words.length) {
          setVisibleText((oldVisText) => oldVisText + (wordIndex > 0 ? " " : "") + words[wordIndex]);
          showIndexRef.current = {
            ...showIndexRef.current,
            wordIndex: wordIndex + 1,
          };
          timeout = setTimeout(displayWords, wordDelay);
        } else {
          showIndexRef.current = {
            sentenceIndex: sentenceIndex + 1,
            wordIndex: 0,
          };
          setVisibleText((oldVisText) => oldVisText + " ");
          timeout = setTimeout(displayWords, sentenceIndex !== textToShow.length - 1 ? Math.floor(Math.max(100, (Math.random() * 500))) : finalDelay ?? 1000);
        }
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    if (opened && textToShow && textToShow.length > 0) {
      displayWords();
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [opened, textToShow]);

  return {
    visibleText: visibleText.trim(),
  }

}