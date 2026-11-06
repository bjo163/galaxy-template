'use client'

import type { DetailedHTMLProps, FormHTMLAttributes } from 'react'

type Props = DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>

const Form = (props: Props) => {
  const { onSubmit, ...rest } = props

  return <form {...rest} onSubmit={onSubmit ? e => onSubmit(e) : e => e.preventDefault()} />
}

export default Form
