/**
 * Header — server component.
 *
 * Displays the current page title at the top of the main content area.
 * Accepts the title as a prop so each page can set its own heading.
 */

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="flex items-center h-14 px-6 border-b border-gray-800 bg-gray-950 shrink-0">
      <h1 className="text-white text-base font-semibold">{title}</h1>
    </header>
  )
}
