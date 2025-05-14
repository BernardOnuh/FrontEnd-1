import logo from "../assets/logo-black.png";

const Logo = () => {
   return (
      <img
         src={logo}
         alt="Aboki Logo"
         className=" object-cover rounded-lg w-45 h-12 mr-4"
      />
   );
};

export default Logo;
