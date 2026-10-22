export function applyLinkage(
  fields,
  model,
) {
  const next = fields.map((f) => ({ ...f }))

  for (const field of next) {
    if (!field.linkage || field.linkage.length === 0) continue

    let computedDisabled = field.disabled
    let computedVisible = field.visible

    for (const rule of field.linkage) {
      if (model[rule.when.field] !== rule.when.equals) continue

      if (typeof rule.then.disabled === 'boolean') computedDisabled = rule.then.disabled
      if (typeof rule.then.visible === 'boolean') computedVisible = rule.then.visible
      if (Object.prototype.hasOwnProperty.call(rule.then, 'setValue')) {
        model[field.key] = rule.then.setValue
      }
    }

    field.disabled = computedDisabled
    field.visible = computedVisible
  }

  return next
}
