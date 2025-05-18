interface SiteFooterProps {
    fullFooter?: boolean
}

export function SiteFooter({ fullFooter = true }: SiteFooterProps) {
    if (!fullFooter) {
        return (
            <footer className="py-6 text-center text-gray-400 text-sm">
                <p>© {new Date().getFullYear()} PAC Salug Campus. All rights reserved.</p>
            </footer>
        )
    }

    return (
        <footer className="bg-slate-900 py-12 border-t border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h4 className="text-white font-bold mb-4">PAC Salug Campus</h4>
                        <p className="text-gray-400 text-sm">
                            Philippine Advent College
                            <br />
                            Salug Campus
                            <br />
                            Zamboanga del Norte
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Help
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    FAQs
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm">
                                    Contact Support
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Contact</h4>
                        <ul className="space-y-2">
                            <li className="text-gray-400 text-sm">Email: info@pacsalug.edu.ph</li>
                            <li className="text-gray-400 text-sm">Phone: (123) 456-7890</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 text-center">
                    <p className="text-gray-400 text-sm">© {new Date().getFullYear()} PAC Salug Campus. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
