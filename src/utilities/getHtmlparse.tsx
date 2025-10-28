export const getParsedValue = (val?: string) => {
  let newVal: any = []
  if (val) {
    newVal = val?.split('\n')

    return (
      <>
        {newVal.map((item: string, i: number) => (
          <p key={i}>
            {item}
            <br />
          </p>
        ))}
      </>
    )
  }

  return '--'
}
