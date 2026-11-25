import React, { useEffect, useRef, useCallback } from "react";

const AutoScrollMenuList = (props) => {
  const { selectProps, innerRef, ...restProps } = props;
  const menuRef = useRef(null);

  const setMenuRef = useCallback(
    (node) => {
      menuRef.current = node;

      // Respect react-select's innerRef behavior (can be function or ref object)
      if (typeof innerRef === "function") {
        innerRef(node);
      } else if (innerRef && typeof innerRef === "object") {
        innerRef.current = node;
      }
    },
    [innerRef]
  );

  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const selected = menuEl.querySelector('[aria-selected="true"]');
    if (selected && typeof selected.scrollIntoView === "function") {
      selected.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectProps?.value]); // re-run when selected value changes

  return (
    <components.MenuList
      {...restProps}
      selectProps={selectProps}
      innerRef={setMenuRef}
    />
  );
};

export default AutoScrollMenuList;
