// Keep the first assignment as the target for the existing workflow actions.
export const groupAssignedClients = (assignments: any[]) => {
  const clients = new Map<string, any>()
  assignments.forEach((assignment) => {
    const key =
      assignment.user_id != null
        ? `user:${assignment.user_id}`
        : `assignment:${assignment.id}`
    let client = clients.get(key)
    if (!client) {
      client = { ...assignment, package_names: [] as string[] }
      clients.set(key, client)
    }
    const name = assignment.anticipated_package?.plan?.name
    if (name && !client.package_names.includes(name)) {
      client.package_names.push(name)
    }
  })
  return Array.from(clients.values()).map((client) => ({
    ...client,
    anticipated_package_names: client.package_names.join(', '),
  }))
}
