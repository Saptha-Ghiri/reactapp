import React, { useState, useRef } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

const VirtualKeyboard = ({ onInput, initialValue = "", onEnter, onClose }) => {
  const [input, setInput] = useState(initialValue);
  const [layoutName, setLayoutName] = useState("default");
  const keyboardRef = useRef(null);

  const onChange = (input) => {
    setInput(input);
    if (onInput) onInput(input);
  };

  const onKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName(layoutName === "default" ? "shift" : "default");
    }

    if (button === "{enter}" && onEnter) {
      onEnter(input);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-100 p-2 border-t border-gray-300 z-10">
      <div className="flex justify-between items-center p-1 mb-2">
        <div className="flex-grow p-1 bg-white border border-gray-300 rounded mr-2 min-h-6 whitespace-nowrap overflow-hidden text-ellipsis">
          {input}
        </div>
        <button
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <Keyboard
        keyboardRef={(r) => (keyboardRef.current = r)}
        layoutName={layoutName}
        onChange={onChange}
        onKeyPress={onKeyPress}
        layout={{
          default: [
            "1 2 3 4 5 6 7 8 9 0 - = {bksp}",
            "q w e r t y u i o p [ ] \\",
            "{lock} a s d f g h j k l ; ' {enter}",
            "{shift} z x c v b n m , . / {shift}",
            "{space}",
          ],
          shift: [
            "! @ # $ % ^ & * ( ) _ + {bksp}",
            "Q W E R T Y U I O P { } |",
            '{lock} A S D F G H J K L : " {enter}',
            "{shift} Z X C V B N M < > ? {shift}",
            "{space}",
          ],
        }}
        display={{
          "{bksp}": "⌫",
          "{enter}": "Enter",
          "{shift}": "⇧",
          "{lock}": "⇪",
          "{space}": "Space",
        }}
      />
    </div>
  );
};

export default VirtualKeyboard;
