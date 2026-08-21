"use client";

import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  confirmation: string;
};

export function ConfirmSubmit({ confirmation, onClick, ...props }: Props) {
  return (
    <button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
        onClick?.(event);
      }}
    />
  );
}
